import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletSelector } from './wallet-selector';

const mockGetBalance = vi.fn();
const mockWallets = [
  { id: 'wallet-1', publicKey: 'GABC123456789', name: 'Trading Wallet', verified: true },
  { id: 'wallet-2', publicKey: 'GXYZ987654321', name: 'Savings Wallet', verified: false },
];

vi.mock('@/hooks/use-wallet', () => ({
  useWallet: () => ({
    wallets: mockWallets,
    getBalance: mockGetBalance,
  }),
}));

describe('WalletSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBalance.mockImplementation((id: string) =>
      Promise.resolve({ available: id === 'wallet-1' ? 42.5 : 10, pending: 0, total: 42.5 })
    );
  });

  it('shows a placeholder when no wallet is selected', () => {
    render(<WalletSelector value={null} onChange={vi.fn()} />);
    expect(screen.getByText('Select a wallet')).toBeInTheDocument();
  });

  it('renders the selected wallet name in the trigger', () => {
    render(<WalletSelector value="wallet-1" onChange={vi.fn()} />);
    expect(screen.getByText('Trading Wallet')).toBeInTheDocument();
  });

  it('opens the dropdown and lists all wallets on click', async () => {
    const user = userEvent.setup();
    render(<WalletSelector value="wallet-1" onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /select wallet to tip from/i }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('calls onChange and closes the dropdown when an option is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WalletSelector value="wallet-1" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /select wallet to tip from/i }));
    await user.click(screen.getByText('Savings Wallet'));

    expect(onChange).toHaveBeenCalledWith('wallet-2');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('fetches and displays balances for each wallet', async () => {
    render(<WalletSelector value="wallet-1" onChange={vi.fn()} />);

    await waitFor(() => expect(mockGetBalance).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('$42.50')).toBeInTheDocument());
  });

  it('renders a message when there are no connected wallets', () => {
    mockWallets.length = 0;
    render(<WalletSelector value={null} onChange={vi.fn()} />);
    expect(screen.getByText('No wallets connected')).toBeInTheDocument();
    mockWallets.push(
      { id: 'wallet-1', publicKey: 'GABC123456789', name: 'Trading Wallet', verified: true },
      { id: 'wallet-2', publicKey: 'GXYZ987654321', name: 'Savings Wallet', verified: false }
    );
  });

  it('disables the trigger button when disabled prop is set', () => {
    render(<WalletSelector value="wallet-1" onChange={vi.fn()} disabled />);
    const button = screen.getByRole('button', { name: /select wallet to tip from/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
