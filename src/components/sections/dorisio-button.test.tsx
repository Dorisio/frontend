import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DorisioButton from './dorisio-button';
import { clearDedupedRequests } from '@/lib/request-deduplicator';
import { useTipTierStore } from '@/stores/tip-tier-store';
import { useScheduledTipsStore } from '@/stores/scheduled-tips-store';

const createTipMock = vi.fn();
const buildTransactionMock = vi.fn();
const submitTransactionMock = vi.fn();
const confirmTransactionMock = vi.fn();
const selectWalletMock = vi.fn();
let loadingState = false;

vi.mock('@/hooks/use-create-tip', () => ({
  useCreateTip: (): {
    createTip: typeof createTipMock;
    buildTransaction: typeof buildTransactionMock;
    submitTransaction: typeof submitTransactionMock;
    confirmTransaction: typeof confirmTransactionMock;
    loading: boolean;
    error: null;
    tip: null;
    reset: () => void;
  } => ({
    createTip: createTipMock,
    buildTransaction: buildTransactionMock,
    submitTransaction: submitTransactionMock,
    confirmTransaction: confirmTransactionMock,
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
  useWallet: (): {
    wallets: typeof mockWallets;
    getPreferredWalletId: () => string;
    setLastUsedWallet: () => void;
    selectWallet: typeof selectWalletMock;
  } => ({
    wallets: mockWallets,
    getPreferredWalletId: (): string => 'wallet-1',
    setLastUsedWallet: vi.fn(),
    selectWallet: selectWalletMock,
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

const successMock = vi.fn();
const errorMock = vi.fn();

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

describe('DorisioButton (Send Tip flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDedupedRequests();
    useTipTierStore.setState({
      tiersByCreator: {},
      recentCustomAmounts: [],
      recentCustomAmountsByCreator: {},
    });
    useScheduledTipsStore.setState({
      scheduledTips: [],
    });
    loadingState = false;
    createTipMock.mockReset();
    buildTransactionMock.mockReset().mockResolvedValue({ fee: 100 });
    submitTransactionMock.mockReset().mockResolvedValue({ status: 'pending' });
    confirmTransactionMock.mockReset().mockResolvedValue({ status: 'confirmed' });
    createTipMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ id: 'tip-1', status: 'success' }), 20);
        })
    );
  });

  async function openModalAndSelectAmount(user: ReturnType<typeof userEvent.setup>): Promise<void> {
    await user.click(screen.getByRole('button', { name: /send a tip/i }));
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
    expect(await screen.findByText('Review Tip')).toBeInTheDocument();
    expect(buildTransactionMock).toHaveBeenCalledOnce();
    expect(selectWalletMock).toHaveBeenCalledWith(mockWallets[0]);
    expect(submitTransactionMock).not.toHaveBeenCalled();
    expect(screen.getByText('0.0000100 XLM')).toBeInTheDocument();
    expect(screen.getByText('$5.00 USDC + 0.0000100 XLM')).toBeInTheDocument();
  });

  it('asks to confirm the amount and recipient with a fee breakdown before sending', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" creatorName="Alice Cooper" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Review Tip');

    expect(screen.getByTestId('tip-confirmation-question')).toHaveTextContent(
      'Send $5.00 tip to Alice Cooper?'
    );
    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('Tip amount')).toBeInTheDocument();
    expect(screen.getByText('Estimated network fee')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(submitTransactionMock).not.toHaveBeenCalled();
  });

  it('submits only after Confirm & Send is pressed', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" creatorName="Alice Cooper" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Review Tip');
    expect(submitTransactionMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm & Send' }));
    await waitFor(() => expect(submitTransactionMock).toHaveBeenCalledOnce());
  });

  it('cancels from the review without submitting the transaction', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Review Tip');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(submitTransactionMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Review Tip')).not.toBeInTheDocument();
  });

  it('does not allow review or submission when the SDK fee estimate is missing', async () => {
    buildTransactionMock.mockResolvedValue({});
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith(
        'The transaction fee estimate is unavailable. Please try again.',
        'Tip failed'
      );
    });
    expect(screen.queryByText('Review Tip')).not.toBeInTheDocument();
    expect(submitTransactionMock).not.toHaveBeenCalled();
  });

  it('only triggers one network call on a rapid double-click of Continue', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);

    const continueButton = screen.getByRole('button', { name: 'Continue' });

    await user.click(continueButton);
    await user.click(continueButton);

    await waitFor(() => {
      expect(createTipMock).toHaveBeenCalledTimes(1);
    });
    await screen.findByText('Review Tip');
    expect(buildTransactionMock).toHaveBeenCalledOnce();
    expect(submitTransactionMock).not.toHaveBeenCalled();
  });

  it('shows a success notification and closes the modal after a successful tip', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await openModalAndSelectAmount(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Review Tip');
    await user.click(screen.getByRole('button', { name: 'Confirm & Send' }));

    await waitFor(() => {
      expect(successMock).toHaveBeenCalledWith(expect.stringContaining('$5'), 'Thank you');
    });
    expect(submitTransactionMock).toHaveBeenCalledOnce();
    expect(confirmTransactionMock).toHaveBeenCalledOnce();
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

  it('closes tip modal when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<DorisioButton creatorId="creator-1" />);

    await user.click(screen.getByRole('button', { name: /send a tip/i }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
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

  describe('Tipping Tier Preset Amounts & Custom Flow', () => {
    it('displays preset tip buttons in order: low to high', async () => {
      const user = userEvent.setup();
      // Unsorted creator tiers
      useTipTierStore.getState().setTipTiers('creator-custom', [50, 2, 20, 5]);

      render(<DorisioButton creatorId="creator-custom" />);
      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      const presetContainer = screen.getByLabelText('Preset tip amounts');
      const buttons = presetContainer.querySelectorAll('button');
      const buttonTexts = Array.from(buttons)
        .map((b) => b.textContent?.trim())
        .filter((t) => t?.startsWith('$'));

      expect(buttonTexts).toEqual(['$2', '$5', '$20', '$50']);
    });

    it('supports 4 to 6 preset buttons in mobile layout', async () => {
      const user = userEvent.setup();
      useTipTierStore.getState().setTipTiers('creator-6', [1, 3, 5, 10, 25, 50]);

      render(<DorisioButton creatorId="creator-6" />);
      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      const presetContainer = screen.getByLabelText('Preset tip amounts');
      expect(presetContainer).toHaveClass('grid');
      // 6 preset buttons + 1 Custom button
      expect(presetContainer.querySelectorAll('button')).toHaveLength(7);
    });

    it('allows entering a custom tip amount', async () => {
      const user = userEvent.setup();
      render(<DorisioButton creatorId="creator-1" />);

      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      // Click Custom
      const customButton = screen.getByRole('button', { name: 'Custom' });
      await user.click(customButton);
      expect(customButton).toHaveAttribute('aria-pressed', 'true');

      // Enter amount
      const customInput = screen.getByLabelText('Custom tip amount');
      await user.type(customInput, '17.5');

      // Continue should be enabled
      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).not.toBeDisabled();

      // Submit tip
      await user.click(continueButton);

      await waitFor(() => {
        expect(createTipMock).toHaveBeenCalledWith({ creatorId: 'creator-1', amount: 17.5 });
      });
      await screen.findByText('Review Tip');
    });

    it('shows validation error for invalid custom amount and disables Continue', async () => {
      const user = userEvent.setup();
      render(<DorisioButton creatorId="creator-1" />);

      await user.click(screen.getByRole('button', { name: /send a tip/i }));
      await user.click(screen.getByRole('button', { name: 'Custom' }));

      const customInput = screen.getByLabelText('Custom tip amount');
      await user.type(customInput, '-5');

      expect(screen.getByText('Please enter an amount greater than $0')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    });

    it('remembers recent custom tips (last 3 used) and allows quick selection', async () => {
      const user = userEvent.setup();
      // Pre-seed 3 recent custom amounts
      useTipTierStore.getState().addRecentCustomAmount(7, 'creator-1');
      useTipTierStore.getState().addRecentCustomAmount(14, 'creator-1');
      useTipTierStore.getState().addRecentCustomAmount(21, 'creator-1');

      render(<DorisioButton creatorId="creator-1" />);
      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      expect(screen.getByLabelText('Recent custom tips')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recent tip $21' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recent tip $14' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recent tip $7' })).toBeInTheDocument();

      // Click recent tip chip
      await user.click(screen.getByRole('button', { name: 'Recent tip $14' }));

      const continueButton = screen.getByRole('button', { name: 'Continue' });
      expect(continueButton).not.toBeDisabled();

      await user.click(continueButton);
      await screen.findByText('Review Tip');

      await waitFor(() => {
        expect(createTipMock).toHaveBeenCalledWith({ creatorId: 'creator-1', amount: 14 });
      });
    });

    it('uses tipTiers prop when passed to DorisioButton', async () => {
      const user = userEvent.setup();
      render(<DorisioButton creatorId="creator-prop" tipTiers={[100, 15, 30]} />);

      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      const presetContainer = screen.getByLabelText('Preset tip amounts');
      const buttons = presetContainer.querySelectorAll('button');
      const buttonTexts = Array.from(buttons)
        .map((b) => b.textContent?.trim())
        .filter((t) => t?.startsWith('$'));

      expect(buttonTexts).toEqual(['$15', '$30', '$100']);
    });
  });

  describe('Scheduled Tip flow', () => {
    it('toggles scheduled tip section and shows delivery date picker and frequency options', async () => {
      const user = userEvent.setup();
      render(<DorisioButton creatorId="creator-1" creatorName="Alice" />);

      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      // Schedule toggle button
      const scheduleToggle = screen.getByRole('button', { name: /schedule tip ⏰/i });
      expect(scheduleToggle).toBeInTheDocument();
      expect(screen.queryByLabelText(/recurring frequency/i)).not.toBeInTheDocument();

      // Click schedule toggle
      await user.click(scheduleToggle);

      expect(screen.getByText('Scheduled ✓')).toBeInTheDocument();
      expect(screen.getByLabelText(/recurring frequency/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Schedule Tip' })).toBeInTheDocument();
    });

    it('schedules a recurring tip into store and notifies user', async () => {
      const user = userEvent.setup();
      render(<DorisioButton creatorId="creator-1" creatorName="Alice" />);

      await user.click(screen.getByRole('button', { name: /send a tip/i }));

      // Select preset amount $10
      await user.click(screen.getByRole('button', { name: '$10' }));

      // Enable scheduling
      await user.click(screen.getByRole('button', { name: /schedule tip ⏰/i }));

      // Select Weekly recurrence
      const weeklyRadio = screen.getByRole('radio', { name: 'Weekly' });
      await user.click(weeklyRadio);
      expect(weeklyRadio).toHaveAttribute('aria-checked', 'true');

      // Click submit
      const scheduleSubmit = screen.getByRole('button', { name: 'Schedule Tip' });
      expect(scheduleSubmit).not.toBeDisabled();
      await user.click(scheduleSubmit);

      // Verify createTip (immediate execution) was NOT called
      expect(createTipMock).not.toHaveBeenCalled();

      // Verify tip is stored in scheduledTipsStore
      const scheduledTips = useScheduledTipsStore.getState().scheduledTips;
      expect(scheduledTips).toHaveLength(1);
      expect(scheduledTips[0]).toMatchObject({
        creatorId: 'creator-1',
        creatorName: 'Alice',
        amount: 10,
        frequency: 'weekly',
        status: 'pending',
      });

      // Verify notification
      expect(successMock).toHaveBeenCalledWith(
        expect.stringContaining('Tip of $10 scheduled'),
        'Tip Scheduled'
      );
    });
  });
});
