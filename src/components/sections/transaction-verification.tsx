/**
 * On-chain verification control for a transaction history row.
 *
 * Verification is opt-in so a large history does not issue one request per
 * row. React Query caches each result for the lifetime of the page.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { useDorisio } from 'dorisio-sdk/react';
import { useState } from 'react';

export interface TransactionVerificationProps {
  transactionId: string;
  transactionHash?: string;
}

export function TransactionVerification({
  transactionId,
  transactionHash,
}: TransactionVerificationProps): JSX.Element {
  const { client } = useDorisio();
  const [requested, setRequested] = useState(false);
  const verification = useQuery({
    queryKey: ['transaction-verification', transactionId],
    queryFn: () => client.isTransactionVerified(transactionId),
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  if (!transactionHash) {
    return (
      <span className="text-xs text-muted-foreground" title="No blockchain transaction hash">
        No hash
      </span>
    );
  }

  const verify = (): void => {
    setRequested(true);
    void verification.refetch();
  };

  if (verification.isFetching) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        Checking…
      </span>
    );
  }

  if (requested && verification.isSuccess) {
    return verification.data ? (
      <span
        className="inline-flex items-center gap-1 text-xs text-green-600"
        role="status"
        aria-label="Blockchain transaction verified"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Verified
      </span>
    ) : (
      <span
        className="inline-flex items-center gap-1 text-xs text-amber-600"
        role="status"
        aria-label="Blockchain transaction not verified"
      >
        Not verified
      </span>
    );
  }

  if (requested && verification.isError) {
    return (
      <button
        type="button"
        onClick={verify}
        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
        aria-label="Retry blockchain transaction verification"
      >
        Unable to verify
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={verify}
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      aria-label="Verify transaction on the blockchain"
    >
      <ShieldCheck className="h-3 w-3" aria-hidden="true" />
      Verify on-chain
    </button>
  );
}
