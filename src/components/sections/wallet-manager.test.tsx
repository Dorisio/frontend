import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletManager } from './wallet-manager';
import { useWallet as useWalletImpl } from '@/hooks/use-wallet';

// Cast to mocked function so .mockReturnValue is available
const useWallet = useWalletImpl as MockedFunction<typeof useWalletImpl>;

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock('@/components/notification-provider', () => ({
  useNotification: (): {
    error: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
    notify: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  } => ({
    error: mockToastError,
    success: mockToastSuccess,
    notify: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

const mockSelectWallet = vi.fn();
const mockDisconnectWallet = vi.fn();

// vi.mock is hoisted — factory must NOT reference top-level const before init
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultWallets = [
  {
    id: '1',
    publicKey: 'GC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456789',
    name: 'Main Wallet',
    verified: true,
  },
  {
    id: '2',
    publicKey: 'GB9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA987654321',
    name: 'Trading Wallet',
    verified: false,
  },
];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function buildHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    wallets: defaultWallets,
    selectedWallet: {
      id: '1',
      publicKey: 'GC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456789',
      name: 'Main Wallet',
      verified: true,
    },
    loading: false,
    error: undefined,
    preferredWallet: null,
    setDefaultWalletId: vi.fn(),
    getPreferredWalletId: vi.fn(),
    setLastUsedWallet: vi.fn(),
    selectWallet: mockSelectWallet,
    disconnectWallet: mockDisconnectWallet,
    fetchWallets: vi.fn(),
    generateNonce: vi.fn(),
    getChallenge: vi.fn(),
    verifyWallet: vi.fn(),
    renameWallet: vi.fn(),
    getBalance: vi.fn(),
    reset: vi.fn(),
    isPending: vi.fn(() => false),
    actionError: null,
    clearActionError: vi.fn(),
    retryAction: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WalletManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWallet).mockReturnValue(buildHookReturn());
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe('Rendering', () => {
    it('renders all connected wallets', () => {
      render(<WalletManager />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
      expect(screen.getByText('Trading Wallet')).toBeInTheDocument();
    });

    it('displays wallet public key', () => {
      render(<WalletManager />);

      const publicKeys = screen.getAllByText(/GC1234567890.*/);
      expect(publicKeys.length).toBeGreaterThan(0);
    });

    it('shows verified badge for verified wallets', () => {
      render(<WalletManager />);

      const verifiedBadges = screen.getAllByText(/✓ Verified/);
      expect(verifiedBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('highlights selected wallet', () => {
      const { container } = render(<WalletManager />);

      const selectedWalletCard = container.querySelector('[data-testid="wallet-1"]');
      expect(selectedWalletCard).toHaveClass('border-primary');
    });

    it('renders delete buttons for each wallet', () => {
      render(<WalletManager />);

      const deleteButtons = screen.getAllByLabelText(/Delete/i);
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // Loading and Error States
  // -------------------------------------------------------------------------
  describe('Loading and Error States', () => {
    it('shows loading state when wallets are loading', () => {
      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({ wallets: [], loading: true, error: undefined })
      );

      render(<WalletManager />);

      expect(screen.getByText(/Loading wallets/i)).toBeInTheDocument();
    });

    it('loading state has accessible role', () => {
      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({ wallets: [], loading: true, error: undefined })
      );

      render(<WalletManager />);

      expect(screen.getByRole('status', { name: /Loading wallets/i })).toBeInTheDocument();
    });

    it('shows error message with label when wallet loading fails', () => {
      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({ wallets: [], loading: false, error: 'Failed to fetch wallets' })
      );

      render(<WalletManager />);

      expect(screen.getByText(/Error loading wallets/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch wallets')).toBeInTheDocument();
    });

    it('error state has accessible alert role', () => {
      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({ wallets: [], loading: false, error: 'Something broke' })
      );

      render(<WalletManager />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows empty state when no wallets are connected', () => {
      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({ wallets: [], selectedWallet: null, loading: false, error: undefined })
      );

      render(<WalletManager />);

      expect(screen.getByText(/No wallets connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect a wallet/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Per-wallet Error State
  // -------------------------------------------------------------------------
  describe('Per-wallet Error State', () => {
    it('shows inline error text after disconnect failure', async () => {
      const user = userEvent.setup();
      mockDisconnectWallet.mockRejectedValue(
        new Error('Wallet not found. It may have already been removed.')
      );

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [{ id: '1', publicKey: 'GC123', name: 'Main Wallet', verified: true }],
          disconnectWallet: mockDisconnectWallet,
        })
      );

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete Main Wallet/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect Wallet/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /^Disconnect$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-error-1')).toBeInTheDocument();
      });
    });

    it('inline error has accessible alert role', async () => {
      const user = userEvent.setup();
      mockDisconnectWallet.mockRejectedValue(new Error('Failed to disconnect wallet.'));

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [{ id: '1', publicKey: 'GC123', name: 'Main Wallet', verified: true }],
          disconnectWallet: mockDisconnectWallet,
        })
      );

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete Main Wallet/i);
      await user.click(deleteButton);

      await waitFor(() => screen.getByText(/Disconnect Wallet/i));

      const confirmButton = screen.getByRole('button', { name: /^Disconnect$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByTestId('wallet-error-1')).toHaveAttribute('role', 'alert');
      });
    });

    it('dismiss button clears inline error', async () => {
      const user = userEvent.setup();
      mockDisconnectWallet.mockRejectedValue(new Error('Failed to disconnect wallet.'));

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [{ id: '1', publicKey: 'GC123', name: 'Main Wallet', verified: true }],
          disconnectWallet: mockDisconnectWallet,
        })
      );

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete Main Wallet/i);
      await user.click(deleteButton);

      await waitFor(() => screen.getByText(/Disconnect Wallet/i));

      const confirmButton = screen.getByRole('button', { name: /^Disconnect$/i });
      await user.click(confirmButton);

      // Close modal via Escape so inline error is visible
      await user.keyboard('{Escape}');

      await waitFor(() => screen.getByTestId('wallet-error-1'));

      const dismissButton = screen.getByRole('button', { name: /Dismiss error/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByTestId('wallet-error-1')).not.toBeInTheDocument();
      });
    });

    it('delete button is disabled while disconnect is in progress', async () => {
      const user = userEvent.setup();

      let resolveFn!: () => void;
      mockDisconnectWallet.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveFn = resolve;
        })
      );

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [{ id: '1', publicKey: 'GC123', name: 'Main Wallet', verified: true }],
          disconnectWallet: mockDisconnectWallet,
        })
      );

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete Main Wallet/i);
      await user.click(deleteButton);

      await waitFor(() => screen.getByText(/Disconnect Wallet/i));

      const confirmButton = screen.getByRole('button', { name: /^Disconnect$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Disconnecting/i })).toBeDisabled();
      });

      resolveFn();
    });
  });

  // -------------------------------------------------------------------------
  // Interactions
  // -------------------------------------------------------------------------
  describe('Interactions', () => {
    it('calls selectWallet when a wallet is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [
            { id: '1', publicKey: 'GC123', name: 'Wallet 1', verified: true },
            { id: '2', publicKey: 'GB456', name: 'Wallet 2', verified: false },
          ],
          selectWallet: mockSelectWallet,
        })
      );

      render(<WalletManager />);

      const wallet2Card = screen.getByTestId('wallet-2');
      await user.click(wallet2Card);

      expect(mockSelectWallet).toHaveBeenCalled();
    });

    it('calls onWalletSelect callback when wallet is selected', async () => {
      const user = userEvent.setup();
      const onWalletSelect = vi.fn();

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [
            { id: '1', publicKey: 'GC123', name: 'Wallet 1', verified: true },
            { id: '2', publicKey: 'GB456', name: 'Wallet 2', verified: false },
          ],
          selectWallet: mockSelectWallet,
        })
      );

      render(<WalletManager onWalletSelect={onWalletSelect} />);

      const wallet2Card = screen.getByTestId('wallet-2');
      await user.click(wallet2Card);

      expect(onWalletSelect).toHaveBeenCalledWith('2');
    });

    it('opens disconnect confirmation modal when delete is clicked', async () => {
      const user = userEvent.setup();

      render(<WalletManager />);

      const deleteButtons = screen.getAllByLabelText(/Delete/i);
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect Wallet/i)).toBeInTheDocument();
      });
    });

    it('calls disconnectWallet when confirmed', async () => {
      const user = userEvent.setup();
      mockDisconnectWallet.mockResolvedValue(undefined);

      vi.mocked(useWallet).mockReturnValue(
        buildHookReturn({
          wallets: [{ id: '1', publicKey: 'GC123', name: 'Main Wallet', verified: true }],
          disconnectWallet: mockDisconnectWallet,
        })
      );

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete Main Wallet/i);
      await user.click(deleteButton);

      await waitFor(() => screen.getByText(/Disconnect Wallet/i));

      const confirmButton = screen.getByRole('button', { name: /^Disconnect$/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDisconnectWallet).toHaveBeenCalledWith('1');
      });
    });
  });

  // -------------------------------------------------------------------------
  // Props
  // -------------------------------------------------------------------------
  describe('Props', () => {
    it('accepts onWalletSelect callback', () => {
      const onWalletSelect = vi.fn();

      render(<WalletManager onWalletSelect={onWalletSelect} />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    });

    it('renders with valid props', () => {
      render(<WalletManager onWalletSelect={vi.fn()} />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  describe('Accessibility', () => {
    it('wallet cards are keyboard navigable', () => {
      const { container } = render(<WalletManager />);

      const walletCards = container.querySelectorAll('[role="button"]');
      expect(walletCards.length).toBeGreaterThan(0);

      walletCards.forEach((card) => {
        expect(card).toHaveAttribute('tabIndex');
      });
    });

    it('delete buttons have accessible labels', () => {
      render(<WalletManager />);

      const deleteButtons = screen.getAllByLabelText(/Delete/i);
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

      deleteButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});
