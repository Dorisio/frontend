/**
 * Tip creation flow integration tests.
 *
 * Exercises the full tip flow through the real `DorisioButton` component
 * backed by the real SDK `useCreateTip` hook (from `dorisio-sdk/react`) and
 * a real TanStack Query `QueryClient`. The SDK service layer (`tipService`)
 * is spied on (not the hook) to drive happy-path, insufficient-balance,
 * rejected-transaction, and network-timeout outcomes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import DorisioButton from './dorisio-button';
import { tipService, useCreateTip, type TipResult } from 'dorisio-sdk/react';
import { clearDedupedRequests } from '@/lib/request-deduplicator';
import { useTipTierStore } from '@/stores/tip-tier-store';
import { useScheduledTipsStore } from '@/stores/scheduled-tips-store';
import { useWalletPreferenceStore } from '@/stores/wallet-preference-store';

const mockWallets = [
  { id: 'wallet-1', publicKey: 'GABC123', name: 'Main Wallet', verified: true },
  { id: 'wallet-2', publicKey: 'GXYZ987', name: 'Trading Wallet', verified: false },
];

const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: (): {
    wallets: typeof mockWallets;
    fetchWallets: () => void;
    getPreferredWalletId: () => string;
    setLastUsedWallet: () => void;
    selectWallet: () => void;
    getBalance: () => void;
  } => ({
    wallets: mockWallets,
    fetchWallets: vi.fn(),
    getPreferredWalletId: (): string => 'wallet-1',
    setLastUsedWallet: vi.fn(),
    selectWallet: vi.fn(),
    getBalance: vi.fn(),
  }),
}));

vi.mock('@/components/notification-provider', () => ({
  useNotification: (): {
    notify: () => void;
    success: typeof successMock;
    error: typeof errorMock;
    info: () => void;
    warning: () => void;
  } => ({
    notify: vi.fn(),
    success: successMock,
    error: errorMock,
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/components/sections/wallet-selector', () => ({
  WalletSelector: ({
    value,
    onChange,
    disabled,
  }: {
    value: string | null;
    onChange: (id: string) => void;
    disabled: boolean;
  }): JSX.Element => (
    <div data-testid="wallet-selector">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid="wallet-select"
      >
        <option value="">Select wallet</option>
        {mockWallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const defaultTransaction = {
  id: 'tx-1',
  creatorId: 'creator-1',
  amount: 0,
  message: undefined,
  status: 'building',
  stellarTxHash: 'tx-hash-1',
  createdAt: new Date().toISOString(),
} as const;

let buildTxMock: ReturnType<typeof vi.fn>;
let submitMock: ReturnType<typeof vi.fn>;
let confirmMock: ReturnType<typeof vi.fn>;
let createTipMock: ReturnType<typeof vi.fn>;

function setupSdk() {
  vi.restoreAllMocks();

  buildTxMock = vi.spyOn(tipService, 'buildTransaction');
  submitMock = vi.spyOn(tipService, 'submitTransaction');
  confirmMock = vi.spyOn(tipService, 'confirmTransaction');
  createTipMock = vi.spyOn(tipService, 'createTip');

  // Defaults: happy path. build -> submit -> confirm all succeed.
  buildTxMock.mockResolvedValue({ ...defaultTransaction, fee: 100 });
  submitMock.mockResolvedValue({ ...defaultTransaction, status: 'submitted' });
  confirmMock.mockResolvedValue({ ...defaultTransaction, status: 'confirmed' });
  createTipMock.mockImplementation(
    async (payload: { creatorId: string; amount: number; message?: string }): Promise<TipResult> => {
      const tx = await buildTxMock();
      const submitted = await submitMock(tx);
      const confirmed = await confirmMock(submitted);
      return {
        id: tx.id,
        status: confirmed.status,
        stellarTxHash: tx.stellarTxHash ?? undefined,
        amount: payload.amount,
      };
    }
  );
}

function makeRender() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const renderUi = (ui: React.ReactNode) =>
    render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { queryClient, render: renderUi };
}

async function openModalAndSelectAmount(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: /send a tip/i }));
  const walletSelect = screen.getByTestId('wallet-select');
  await user.selectOptions(walletSelect, 'wallet-1');
  await user.click(screen.getByRole('button', { name: '$5' }));
}

describe('Tip creation flow (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDedupedRequests();
    setupSdk();
    useTipTierStore.setState({
      tiersByCreator: {},
      recentCustomAmounts: [],
      recentCustomAmountsByCreator: {},
    });
    useScheduledTipsStore.setState({ scheduledTips: [] });
    useWalletPreferenceStore.setState({ defaultWalletId: null, lastUsedWalletByCreator: {} });
    successMock.mockClear();
    errorMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('completes a happy-path tip end-to-end: input, wallet, submission, confirmation', async () => {
    const user = userEvent.setup();
    const { render: renderUi } = makeRender();
    renderUi(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);

    // Continue becomes enabled once amount + wallet are selected
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).not.toBeDisabled();

    await user.click(continueButton);
    await waitFor(() => expect(screen.getByText('Review Tip')).toBeInTheDocument());

    // Verify submission + preparation reached the review screen
    await waitFor(() => {
      expect(createTipMock).toHaveBeenCalledWith({
        creatorId: 'creator-1',
        amount: 5,
        message: undefined,
      });
    });
    expect(buildTxMock).toHaveBeenCalled();
    expect(screen.getByText('$5.00 USDC + 0.0000100 XLM')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm & Send' }));

    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith(expect.stringContaining('$5'), 'Thank you');
    });
    expect(submitMock).toHaveBeenCalled();
    expect(confirmMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /send a tip/i })).not.toBeInTheDocument();
    });
  });

  it('shows an error when the balance is insufficient', async () => {
    const user = userEvent.setup();
    const { render: renderUi } = makeRender();
    renderUi(<DorisioButton creatorId="creator-1" />);

    buildTxMock.mockRejectedValue(new Error('Insufficient balance'));

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('Insufficient balance', 'Tip failed');
    });
    expect(screen.queryByText('Review Tip')).not.toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('shows an error when the transaction is rejected', async () => {
    const user = userEvent.setup();
    const { render: renderUi } = makeRender();
    renderUi(<DorisioButton creatorId="creator-1" />);

    // submit returns a failed status; confirmation path surfaces the rejection
    submitMock.mockResolvedValue({ ...defaultTransaction, status: 'failed' });

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByText('Review Tip')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Confirm & Send' }));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith(
        'The payment could not be completed. Please try again.',
        'Tip failed'
      );
    });
    expect(successMock).not.toHaveBeenCalled();
  });

  it('shows an error on network timeout', async () => {
    const user = userEvent.setup();
    const { render: renderUi } = makeRender();
    renderUi(<DorisioButton creatorId="creator-1" />);

    createTipMock.mockRejectedValue(new Error('The request timed out.'));

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('The request timed out.', 'Tip failed');
    });
    expect(screen.queryByText('Review Tip')).not.toBeInTheDocument();
  });

  it('verifies tip state updates after a completed tip', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useCreateTip(), { wrapper: Wrapper });

    expect(result.current.tip).toBeNull();
    expect(result.current.loading).toBe(false);

    await act(async () => {
      await result.current.createTip({ creatorId: 'creator-1', amount: 5, message: 'Great work' });
    });

    expect(result.current.tip).toEqual({
      id: 'tx-1',
      amount: 5,
      status: 'confirmed',
      transactionHash: 'tx-hash-1',
    });
    expect(result.current.loading).toBe(false);
    expect(createTipMock).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      amount: 5,
      message: 'Great work',
    });
  });
});
