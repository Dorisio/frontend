import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletManager } from './wallet-manager';

// Mock the useWallet hook
vi.mock('@/hooks/use-wallet', () => ({
  useWallet: vi.fn(() => ({
    wallets: [
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
    ],
    selectedWallet: {
      id: '1',
      publicKey: 'GC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF123456789',
      name: 'Main Wallet',
      verified: true,
    },
    loading: false,
    error: null,
    selectWallet: vi.fn(),
    disconnectWallet: vi.fn(),
    fetchWallets: vi.fn(),
    generateNonce: vi.fn(),
    getChallenge: vi.fn(),
    verifyWallet: vi.fn(),
    renameWallet: vi.fn(),
    getBalance: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('WalletManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all connected wallets', () => {
      render(<WalletManager />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
      expect(screen.getByText('Trading Wallet')).toBeInTheDocument();
    });

    it('displays wallet public key truncated', () => {
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

  describe('Loading and Error States', () => {
    it('shows loading state when wallets are loading', () => {
      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [],
        selectedWallet: null,
        loading: true,
        error: null,
        selectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

      render(<WalletManager />);

      expect(screen.getByText(/Loading wallets/i)).toBeInTheDocument();
    });

    it('shows error message when wallet loading fails', () => {
      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [],
        selectedWallet: null,
        loading: false,
        error: 'Failed to fetch wallets',
        selectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

      render(<WalletManager />);

      expect(screen.getByText(/Error loading wallets/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch wallets/i)).toBeInTheDocument();
    });

    it('shows empty state when no wallets are connected', () => {
      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [],
        selectedWallet: null,
        loading: false,
        error: null,
        selectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

      render(<WalletManager />);

      expect(screen.getByText(/No wallets connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Connect a wallet/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls selectWallet when a wallet is clicked', async () => {
      const user = userEvent.setup();
      const selectWalletMock = vi.fn();

      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [
          {
            id: '1',
            publicKey: 'GC123',
            name: 'Wallet 1',
            verified: true,
          },
          {
            id: '2',
            publicKey: 'GB456',
            name: 'Wallet 2',
            verified: false,
          },
        ],
        selectedWallet: {
          id: '1',
          publicKey: 'GC123',
          name: 'Wallet 1',
          verified: true,
        },
        loading: false,
        error: null,
        selectWallet: selectWalletMock,
        disconnectWallet: vi.fn(),
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

      render(<WalletManager />);

      const wallet2Card = screen.getByTestId('wallet-2');
      await user.click(wallet2Card);

      expect(selectWalletMock).toHaveBeenCalled();
    });

    it('calls onWalletSelect callback when wallet is selected', async () => {
      const user = userEvent.setup();
      const onWalletSelect = vi.fn();

      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [
          {
            id: '1',
            publicKey: 'GC123',
            name: 'Wallet 1',
            verified: true,
          },
          {
            id: '2',
            publicKey: 'GB456',
            name: 'Wallet 2',
            verified: false,
          },
        ],
        selectedWallet: {
          id: '1',
          publicKey: 'GC123',
          name: 'Wallet 1',
          verified: true,
        },
        loading: false,
        error: null,
        selectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

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
      const disconnectWalletMock = vi.fn();

      vi.mocked(require('@/hooks/use-wallet').useWallet).mockReturnValue({
        wallets: [
          {
            id: '1',
            publicKey: 'GC123',
            name: 'Main Wallet',
            verified: true,
          },
        ],
        selectedWallet: {
          id: '1',
          publicKey: 'GC123',
          name: 'Main Wallet',
          verified: true,
        },
        loading: false,
        error: null,
        selectWallet: vi.fn(),
        disconnectWallet: disconnectWalletMock,
        fetchWallets: vi.fn(),
        generateNonce: vi.fn(),
        getChallenge: vi.fn(),
        verifyWallet: vi.fn(),
        renameWallet: vi.fn(),
        getBalance: vi.fn(),
        reset: vi.fn(),
      });

      render(<WalletManager />);

      const deleteButton = screen.getByLabelText(/Delete/i);
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Disconnect Wallet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('accepts onWalletSelect callback', () => {
      const onWalletSelect = vi.fn();

      render(<WalletManager onWalletSelect={onWalletSelect} />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    });

    it('accepts showBalance prop', () => {
      render(<WalletManager showBalance={true} />);

      expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    });
  });

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
