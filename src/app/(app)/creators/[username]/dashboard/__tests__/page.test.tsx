/**
 * Integration tests for the creator dashboard's data loading (#7).
 *
 * Mocks the SDK hooks (`dorisio-sdk/react`) the way `use-wallet.test.ts`
 * does — at the SDK boundary, via the hoisted `vi.mock` factory, not at
 * `@/hooks/*` — so these tests exercise the real
 * useCreatorBalance/useTransactionHistory/useWallet wrapper hooks and the
 * page's own rendering logic together, which is what makes this an
 * integration test rather than a unit test of the page in isolation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useCreatorBalance as sdkUseCreatorBalance,
  useTransactionHistory as sdkUseTransactionHistory,
  useWallet as sdkUseWallet,
} from 'dorisio-sdk/react';
import { useAuthStore } from '@/stores/auth-store';
import CreatorDashboardPage from '../page';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ username: 'testcreator' }),
  useRouter: () => ({ replace, push: vi.fn() }),
  // useTransactionFilter syncs filter state to URL search params.
  useSearchParams: () => new URLSearchParams(),
}));

// useRealtimeNotifications (#11) needs a QueryClientProvider ancestor
// (useQueryClient) that these tests don't set up, since they're focused
// on data loading, not the live-connection indicator; its own behavior is
// covered exhaustively by use-realtime-notifications.test.tsx.
vi.mock('@/hooks/use-realtime-notifications', () => ({
  useRealtimeNotifications: vi.fn(() => ({ notifications: [], isConnected: false, error: null })),
}));

function balanceResult(
  overrides: Partial<ReturnType<typeof sdkUseCreatorBalance>> = {}
): ReturnType<typeof sdkUseCreatorBalance> {
  return {
    balance: undefined,
    loading: false,
    error: undefined,
    fetchBalance: vi.fn(),
    refetch: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof sdkUseCreatorBalance>;
}

function transactionHistoryResult(
  overrides: Partial<ReturnType<typeof sdkUseTransactionHistory>> = {}
): ReturnType<typeof sdkUseTransactionHistory> {
  return {
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: undefined,
    fetchHistory: vi.fn(),
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    setPageSize: vi.fn(),
    refetch: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof sdkUseTransactionHistory>;
}

function walletResult(
  overrides: Partial<ReturnType<typeof sdkUseWallet>> = {}
): ReturnType<typeof sdkUseWallet> {
  return {
    wallets: [],
    selectedWallet: undefined,
    loading: false,
    error: undefined,
    challengeStep: 'idle',
    generateNonce: vi.fn(),
    getChallenge: vi.fn(),
    verifyWallet: vi.fn(),
    listWallets: vi.fn(),
    selectWallet: vi.fn(),
    unlinkWallet: vi.fn(),
    renameWallet: vi.fn(),
    getBalance: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof sdkUseWallet>;
}

vi.mock('dorisio-sdk/react', () => ({
  useCreatorBalance: vi.fn(() => ({
    balance: null,
    loading: false,
    error: null,
    fetchBalance: vi.fn(),
    refetch: vi.fn(),
    reset: vi.fn(),
  })),
  useTransactionHistory: vi.fn(() => ({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    error: null,
    fetchHistory: vi.fn(),
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    setPageSize: vi.fn(),
    refetch: vi.fn(),
    reset: vi.fn(),
  })),
  useWallet: vi.fn(() => ({
    wallets: [],
    selectedWallet: null,
    loading: false,
    error: null,
    generateNonce: vi.fn(),
    getChallenge: vi.fn(),
    verifyWallet: vi.fn(),
    listWallets: vi.fn(),
    selectWallet: vi.fn(),
    unlinkWallet: vi.fn(),
    renameWallet: vi.fn(),
    getBalance: vi.fn(),
    reset: vi.fn(),
  })),
}));

const REALISTIC_TRANSACTIONS = ([
  {
    id: 'tx-1',
    senderUsername: 'fan_alice',
    amount: 25,
    status: 'confirmed' as const,
    createdAt: '2026-08-01T12:00:00.000Z',
    transactionHash: 'abcdef1234567890',
  },
  {
    id: 'tx-2',
    senderId: 'anon-sender',
    amount: 5,
    status: 'pending' as const,
    createdAt: '2026-08-02T09:30:00.000Z',
  },
] as unknown as ReturnType<typeof sdkUseTransactionHistory>['transactions']);

describe('CreatorDashboardPage data loading (#7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'u1', email: 'creator@example.com', username: 'testcreator', role: 'creator' },
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
    });

    vi.mocked(sdkUseCreatorBalance).mockImplementation(() => balanceResult());
    vi.mocked(sdkUseTransactionHistory).mockImplementation(() => transactionHistoryResult());
    vi.mocked(sdkUseWallet).mockImplementation(() => walletResult());
  });

  describe('access control', () => {
    it('redirects away when the viewer is not the dashboard owner', () => {
      useAuthStore.setState({
        user: { id: 'u2', email: 'other@example.com', username: 'someoneelse', role: 'creator' },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      render(<CreatorDashboardPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(replace).toHaveBeenCalledWith('/creators/testcreator');
    });

    it('shows Access Denied without a user, and does not attempt to render dashboard data', () => {
      useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });

      render(<CreatorDashboardPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByText('Creator Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('shows earnings card skeletons while the balance is loading', () => {
      vi.mocked(sdkUseCreatorBalance).mockImplementation(() =>
        balanceResult({ loading: true })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getAllByRole('status', { name: /loading earnings/i })).toHaveLength(3);
    });

    it('shows the transaction table skeleton while transactions are loading and none are cached yet', () => {
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ loading: true, transactions: [] })
      );

      render(<CreatorDashboardPage />);

      expect(
        screen.getByRole('status', { name: /loading transaction history/i })
      ).toBeInTheDocument();
    });

    it('does not show the table skeleton once transactions are cached, even while a refetch is in flight', () => {
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ loading: true, transactions: REALISTIC_TRANSACTIONS, total: 2 })
      );

      render(<CreatorDashboardPage />);

      expect(
        screen.queryByRole('status', { name: /loading transaction history/i })
      ).not.toBeInTheDocument();
      expect(screen.getByText('fan_alice')).toBeInTheDocument();
    });
  });

  describe('happy path: data rendering', () => {
    it('renders earnings figures once the balance loads', () => {
      vi.mocked(sdkUseCreatorBalance).mockImplementation(() =>
        balanceResult({
          balance: { totalEarnings: 1000, pendingBalance: 200 },
        })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$800.00')).toBeInTheDocument();
      expect(screen.getByText('$200.00')).toBeInTheDocument();
    });

    it('renders realistic transaction rows with sender, amount, status, and tx hash', () => {
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ transactions: REALISTIC_TRANSACTIONS, total: 2 })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getByText('fan_alice')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getAllByText('Confirmed')).toHaveLength(2);
      expect(screen.getAllByText('Pending')).toHaveLength(2);
      // Anonymous sender falls back to a truncated id, per the page's own logic
      expect(screen.getByText('anon-sen...')).toBeInTheDocument();
    });

    it('renders connected wallets', () => {
      vi.mocked(sdkUseWallet).mockImplementation(() =>
        walletResult({
          wallets: [
            {
              id: 'w1',
              userId: 'u1',
              publicKey: 'GABC...XYZ',
              name: 'Main Wallet',
              verified: true,
              createdAt: '2026-08-01T12:00:00.000Z',
            },
          ],
        })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    });
  });

  describe('verification status', () => {
    it('shows the creator verification state and details', () => {
      useAuthStore.setState({
        user: {
          id: 'u1',
          email: 'creator@example.com',
          username: 'testcreator',
          role: 'creator',
          verified: true,
          verificationStatus: 'verified',
          verificationType: 'identity',
        },
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
      });

      render(<CreatorDashboardPage />);

      expect(screen.getByRole('status', { name: 'Verified status' })).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('identity')).toBeInTheDocument();
    });
  });

  describe('empty states', () => {
    it('shows "No transactions yet" once loading finishes with zero results', () => {
      render(<CreatorDashboardPage />);
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });

    it('shows "No wallets connected yet." with zero wallets', () => {
      render(<CreatorDashboardPage />);
      expect(screen.getByText('No wallets connected yet.')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows an earnings error banner and does not render the loading skeleton once the balance request fails', () => {
      vi.mocked(sdkUseCreatorBalance).mockImplementation(() =>
        balanceResult({ error: 'Network request failed' })
      );

      render(<CreatorDashboardPage />);

      expect(
        screen.getByText('Unable to load earnings: Network request failed')
      ).toBeInTheDocument();
      expect(screen.queryByRole('status', { name: /loading earnings/i })).not.toBeInTheDocument();
    });

    it('shows a transaction history error banner without crashing the rest of the page', () => {
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ error: 'Failed to fetch transactions' })
      );

      render(<CreatorDashboardPage />);

      expect(
        screen.getByText('Unable to load transaction history: Failed to fetch transactions')
      ).toBeInTheDocument();
      // The rest of the dashboard (earnings section) still renders.
      expect(screen.getByText('Total Earnings')).toBeInTheDocument();
    });

    it('does not show an error banner while a request is still loading, even if a previous error is cached', () => {
      vi.mocked(sdkUseCreatorBalance).mockImplementation(() =>
        balanceResult({ error: 'stale error', loading: true })
      );

      render(<CreatorDashboardPage />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('pagination (cache/page-state behavior)', () => {
    it('only shows pagination controls once there is more than one page of results', () => {
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ transactions: REALISTIC_TRANSACTIONS, total: 2, pageSize: 10 })
      );

      render(<CreatorDashboardPage />);

      expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    });

    it('shows pagination controls and calls goToPage when total exceeds the page size', async () => {
      const user = userEvent.setup();
      const goToPage = vi.fn();
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({
          transactions: REALISTIC_TRANSACTIONS,
          total: 25,
          page: 1,
          pageSize: 10,
          goToPage,
        })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
      await user.click(screen.getByText('Next →'));
      expect(goToPage).toHaveBeenCalledWith(2);
    });

    it('calls setPageSize when the page-size selector changes', async () => {
      const user = userEvent.setup();
      const setPageSize = vi.fn();
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ setPageSize })
      );

      render(<CreatorDashboardPage />);

      await user.selectOptions(screen.getByLabelText('Transactions per page'), '50');
      expect(setPageSize).toHaveBeenCalledWith(50);
    });
  });

  describe('transaction filtering and export (#25)', () => {
    it('filters the rendered rows when a status filter is applied', async () => {
      const user = userEvent.setup();
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ transactions: REALISTIC_TRANSACTIONS, total: 2 })
      );

      render(<CreatorDashboardPage />);

      expect(screen.getByText('fan_alice')).toBeInTheDocument();

      await user.selectOptions(screen.getByLabelText('Status'), 'pending');

      // Only the pending transaction remains; the confirmed one is filtered out.
      expect(screen.queryByText('fan_alice')).not.toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
      expect(screen.getByText(/Export CSV \(1\)/)).toBeInTheDocument();
    });

    it('shows a no-match message when filters exclude every transaction', async () => {
      const user = userEvent.setup();
      vi.mocked(sdkUseTransactionHistory).mockImplementation(() =>
        transactionHistoryResult({ transactions: REALISTIC_TRANSACTIONS, total: 2 })
      );

      render(<CreatorDashboardPage />);

      await user.type(screen.getByLabelText('Min amount'), '999');

      expect(screen.getByText('No transactions match the current filters')).toBeInTheDocument();
    });
  });

  describe('realtime connection indicator (#11)', () => {
    it('shows Offline when useRealtimeNotifications reports not connected', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      vi.mocked(useRealtimeNotifications).mockReturnValue({
        notifications: [],
        isConnected: false,
        error: null,
      });

      render(<CreatorDashboardPage />);

      expect(screen.getByText('● Offline')).toBeInTheDocument();
    });

    it('shows Live when useRealtimeNotifications reports connected', async () => {
      const { useRealtimeNotifications } = await import('@/hooks/use-realtime-notifications');
      vi.mocked(useRealtimeNotifications).mockReturnValue({
        notifications: [],
        isConnected: true,
        error: null,
      });

      render(<CreatorDashboardPage />);

      expect(screen.getByText('● Live')).toBeInTheDocument();
    });
  });
});
