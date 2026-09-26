import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDorisio } from 'dorisio-sdk/react';
import { TransactionVerification } from './transaction-verification';

vi.mock('dorisio-sdk/react', () => ({
  useDorisio: vi.fn(),
}));

const mockUseDorisio = vi.mocked(useDorisio);

function renderVerification(overrides: { verified?: boolean; reject?: boolean } = {}) {
  const client = {
    isTransactionVerified: overrides.reject
      ? vi.fn().mockRejectedValue(new Error('verification unavailable'))
      : vi.fn().mockResolvedValue(overrides.verified ?? true),
  };
  mockUseDorisio.mockReturnValue({ client } as unknown as ReturnType<typeof useDorisio>);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    ...render(
      <QueryClientProvider client={queryClient}>
        <TransactionVerification transactionId="tx-1" transactionHash="stellar-hash" />
      </QueryClientProvider>
    ),
  };
}

describe('TransactionVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not request verification until the user asks', () => {
    const { client } = renderVerification();

    expect(
      screen.getByRole('button', { name: /verify transaction on the blockchain/i })
    ).toBeInTheDocument();
    expect(client.isTransactionVerified).not.toHaveBeenCalled();
  });

  it('shows a verified result after checking the transaction', async () => {
    const user = userEvent.setup();
    const { client } = renderVerification({ verified: true });

    await user.click(screen.getByRole('button', { name: /verify transaction on the blockchain/i }));

    await waitFor(() =>
      expect(screen.getByRole('status', { name: /verified/i })).toBeInTheDocument()
    );
    expect(client.isTransactionVerified).toHaveBeenCalledWith('tx-1');
  });

  it('offers a retry when verification fails', async () => {
    const user = userEvent.setup();
    renderVerification({ reject: true });

    await user.click(screen.getByRole('button', { name: /verify transaction on the blockchain/i }));

    expect(
      await screen.findByRole('button', { name: /retry blockchain transaction verification/i })
    ).toBeInTheDocument();
  });

  it('explains when a transaction has no blockchain hash', () => {
    const client = { isTransactionVerified: vi.fn() };
    mockUseDorisio.mockReturnValue({ client } as unknown as ReturnType<typeof useDorisio>);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <TransactionVerification transactionId="tx-1" />
      </QueryClientProvider>
    );

    expect(screen.getByText('No hash')).toBeInTheDocument();
    expect(client.isTransactionVerified).not.toHaveBeenCalled();
  });
});
