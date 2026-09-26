import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DorisioButton from './dorisio-button';
import { clearDedupedRequests } from '@/lib/request-deduplicator';

const createTipMock = vi.fn();
let loadingState = false;

vi.mock('@/hooks/use-create-tip', () => ({
  useCreateTip: () => ({
    createTip: createTipMock,
    loading: loadingState,
    error: null,
    tip: null,
    reset: vi.fn(),
  }),
}));

const mockWallets = [
  { id: 'wallet-1', publicKey: 'GABC123', name: 'Main Wallet', verified: true },
  { id: 'wallet-2', publicKey: 'GXYZ987', name: 'Trading Wallet', verified: false },
];

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallets: mockWallets,
    getPreferredWalletId: () => 'wallet-1',
    setLastUsedWallet: vi.fn(),
  }),
}));

vi.mock('@/components/sections/wallet-selector', () => ({
  WalletSelector: ({ value, onChange, disabled }: { value: string | null; onChange: (id: string) => void; disabled: boolean }) => (
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

const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('@/components/notification-provider', () => ({
  useNotification: () => ({
    notify: vi.fn(),
    success: successMock,
    error: errorMock,
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('DorisioButton (Send Tip flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDedupedRequests();
    loadingState = false;
    createTipMock.mockReset();
    createTipMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ id: 'tip-1', status: 'success' }), 20);
        })
    );
  });

  async function openModalAndSelectAmount(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await user.click(screen.getByRole('button', { name: /send a tip/i }));
    // Wallet is auto-selected, but we can manually select a different one if needed
    const walletSelect = screen.getByTestId('wallet-select');
    await user.selectOptions(walletSelect, 'wallet-1');
    await user.click(screen.getByRole('button', { name: '$5' }));
  }

  it('opens the tip modal and lets the user pick an amount', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    expect(screen.getByText('Send a Tip')).toBeInTheDocument();

    const fiveDollarOption = screen.getByRole('button', { name: '$5' });
    await user.click(fiveDollarOption);

    expect(fiveDollarOption).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables Continue until an amount is selected (wallet is auto-selected)', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    // Wallet is auto-selected, but amount is not yet selected
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('calls createTip with the selected creator and amount', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(createTipMock).toHaveBeenCalledWith({ creatorId: 'creator-1', amount: 5 });
    });
  });

  it('only triggers one network call on a rapid double-click of Continue', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);

    const continueButton = screen.getByRole('button', { name: 'Continue' });

    // Two rapid clicks, as if a user double-clicked before the first
    // request resolved (matches the issue's own reproduction: double-click
    // "Send Tip" creates two tips).
    await user.click(continueButton);
    await user.click(continueButton);

    await waitFor(() => {
      expect(createTipMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows a success notification and closes the modal after a successful tip', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith(expect.stringContaining('$5'), 'Thank you');
    });
    await waitFor(() => {
      expect(screen.queryByText('Send a Tip')).not.toBeInTheDocument();
    });
  });

  it('shows an error notification when the tip fails', async () => {
    createTipMock.mockRejectedValue(new Error('Insufficient funds'));
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith('Insufficient funds', 'Tip failed');
    });
  });

  it('displays wallet selector in the modal', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    expect(screen.getByTestId('wallet-selector')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-select')).toBeInTheDocument();
  });

  it('auto-selects preferred wallet when modal opens', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    const walletSelect = screen.getByTestId('wallet-select') as HTMLSelectElement;
    expect(walletSelect.value).toBe('wallet-1');
  });

  it('allows switching wallets before sending tip', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    const walletSelect = screen.getByTestId('wallet-select');
    await user.selectOptions(walletSelect, 'wallet-2');

    expect((walletSelect as HTMLSelectElement).value).toBe('wallet-2');
  });
});
