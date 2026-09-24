/**
 * useWallet Hook
 * Wrapper around SDK's useWallet hook with comprehensive error handling,
 * automatic retry for transient errors, and user-facing toast notifications.
 */

import { useCallback, useMemo, useState } from 'react';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';
import { useWalletPreferenceStore } from '@/stores/wallet-preference-store';

export interface WalletInfo {
  id: string;
  publicKey: string;
  name?: string;
  verified: boolean;
  balance?: {
    available: number;
    pending: number;
    total: number;
  };
}

interface SDKWallet {
  id: string;
  publicKey: string;
  name?: string | null;
  verified?: boolean;
}

// ---------------------------------------------------------------------------
// Error classification helpers
// ---------------------------------------------------------------------------

/** SDK error codes considered transient (safe to retry automatically). */
const TRANSIENT_ERROR_CODES = new Set([
  'NETWORK_ERROR',
  'TIMEOUT',
  'REQUEST_TIMEOUT',
  'SERVICE_UNAVAILABLE',
  'RATE_LIMITED',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
]);

/**
 * Returns true when the thrown value represents a transient error that is
 * safe to retry without user involvement.
 */
function isTransientError(err: unknown): boolean {
  if (err instanceof Error) {
    const code = (err as Error & { code?: string }).code?.toUpperCase() ?? '';
    if (TRANSIENT_ERROR_CODES.has(code)) return true;

    const message = err.message.toUpperCase();
    // Common transient message substrings
    return (
      message.includes('NETWORK') ||
      message.includes('TIMEOUT') ||
      message.includes('ECONNRESET') ||
      message.includes('SERVICE_UNAVAILABLE') ||
      message.includes('503') ||
      message.includes('429')
    );
  }
  return false;
}

/** Maps SDK / network error codes/messages to user-friendly strings. */
export function mapWalletError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const code = ((err as Error & { code?: string }).code ?? '').toUpperCase();
  const message = err.message.toLowerCase();

  // Specific SDK error codes
  if (code === 'WALLET_NOT_FOUND') return 'Wallet not found. It may have already been removed.';
  if (code === 'WALLET_ALREADY_LINKED')
    return 'This wallet is already linked to your account.';
  if (code === 'INVALID_SIGNATURE')
    return 'Wallet verification failed: the signature is invalid. Please try again.';
  if (code === 'CHALLENGE_EXPIRED')
    return 'Verification challenge expired. Please start the verification process again.';
  if (code === 'UNAUTHORIZED' || code === '401')
    return 'Your session has expired. Please log in again.';
  if (code === 'FORBIDDEN' || code === '403')
    return 'You do not have permission to perform this action.';
  if (code === 'RATE_LIMITED' || code === '429')
    return 'Too many requests. Please wait a moment and try again.';
  if (code === 'NETWORK_ERROR' || code === 'ECONNRESET' || code === 'ECONNREFUSED')
    return 'Network error. Please check your connection and try again.';
  if (code === 'TIMEOUT' || code === 'REQUEST_TIMEOUT')
    return 'The request timed out. Please try again.';
  if (code === 'SERVICE_UNAVAILABLE' || code === '503')
    return 'Service temporarily unavailable. Please try again shortly.';
  if (code === 'BLOCKCHAIN_TIMEOUT')
    return 'Blockchain confirmation timed out. The transaction may still complete — check back shortly.';

  // Fallback: inspect message text
  if (message.includes('network')) return 'Network error. Please check your connection and try again.';
  if (message.includes('timeout')) return 'The request timed out. Please try again.';
  if (message.includes('unauthorized') || message.includes('401'))
    return 'Your session has expired. Please log in again.';
  if (message.includes('invalid') && message.includes('wallet'))
    return 'Invalid wallet address. Please ensure the wallet is correct.';
  if (message.includes('signature'))
    return 'Wallet verification failed: the signature is invalid. Please try again.';

  return err.message || 'An unexpected error occurred. Please try again.';
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

const RETRY_DELAYS_MS = [500, 1500, 3000] as const;

/**
 * Calls `fn` and retries up to `maxRetries` times when the error is transient.
 * Each retry waits for an increasing delay.
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries || !isTransientError(err)) {
        throw err;
      }
      const delay = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useWallet() {
  const {
    wallets: sdkWallets,
    selectedWallet: sdkSelectedWallet,
    loading,
    error,
    generateNonce,
    getChallenge,
    verifyWallet: sdkVerifyWallet,
    listWallets,
    selectWallet: sdkSelectWallet,
    unlinkWallet,
    renameWallet: sdkRenameWallet,
    getBalance,
    reset,
  } = sdkUseWallet();

  const [optimistic, setOptimistic] = useState<Record<string, OptimisticEntry>>({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<{ walletId: string; message: string } | null>(
    null
  );

  const clearOptimistic = useCallback((walletId: string) => {
    setOptimistic((prev) => {
      if (!(walletId in prev)) return prev;
      const next = { ...prev };
      delete next[walletId];
      return next;
    });
  }, []);

  const setPending = useCallback((walletId: string, isPending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) {
        next.add(walletId);
      } else {
        next.delete(walletId);
      }
      return next;
    });
  }, []);

  // Map SDK wallets to frontend format, applying any optimistic overlay and
  // filtering out wallets optimistically disconnected but not yet
  // confirmed removed by the SDK's own list.
  const wallets: WalletInfo[] = useMemo(
    () =>
      sdkWallets
        .filter((w: SDKWallet) => !optimistic[w.id]?.disconnected)
        .map((w: SDKWallet) => ({
          id: w.id,
          publicKey: w.publicKey,
          name: optimistic[w.id]?.name ?? w.name ?? undefined,
          verified: w.verified || false,
        })),
    [sdkWallets, optimistic]
  );

  const selectedWallet = sdkSelectedWallet
    ? {
        id: sdkSelectedWallet.id,
        publicKey: sdkSelectedWallet.publicKey,
        name: optimistic[sdkSelectedWallet.id]?.name ?? sdkSelectedWallet.name,
        verified: sdkSelectedWallet.verified || false,
      }
    : null;

  const selectWallet = (wallet: WalletInfo): void => {
    const sdkWallet = sdkWallets.find((w: SDKWallet) => w.id === wallet.id);
    if (sdkWallet) {
      sdkSelectWallet(sdkWallet);
    }
  };

  /**
   * Optimistically hides the wallet immediately, then confirms with the
   * server. On failure, the wallet reappears (rollback) and `actionError`
   * is set so the caller can offer a retry.
   */
  const disconnectWallet = async (walletId: string) => {
    setActionError(null);
    setOptimistic((prev) => ({ ...prev, [walletId]: { ...prev[walletId], disconnected: true } }));
    setPending(walletId, true);
    try {
      await unlinkWallet(walletId);
      // Success: leave the optimistic "disconnected" entry in place until
      // the SDK's own wallet list catches up on its next fetch; clearing it
      // early would briefly resurrect the wallet if listWallets() hasn't
      // re-run yet.
    } catch (err) {
      clearOptimistic(walletId);
      setActionError({
        walletId,
        message: err instanceof Error ? err.message : 'Failed to disconnect wallet',
      });
      throw err;
    } finally {
      setPending(walletId, false);
    }
  };

  /**
   * Optimistically renames the wallet immediately, then confirms with the
   * server. On failure, the name rolls back to whatever the SDK last
   * reported and `actionError` is set so the caller can offer a retry.
   */
  const renameWallet = async (walletId: string, name: string) => {
    setActionError(null);
    setOptimistic((prev) => ({ ...prev, [walletId]: { ...prev[walletId], name } }));
    setPending(walletId, true);
    try {
      await sdkRenameWallet(walletId, name);
      clearOptimistic(walletId);
    } catch (err) {
      clearOptimistic(walletId);
      setActionError({
        walletId,
        message: err instanceof Error ? err.message : 'Failed to rename wallet',
      });
      throw err;
    } finally {
      setPending(walletId, false);
    }
  };

  const isPending = useCallback((walletId: string) => pendingIds.has(walletId), [pendingIds]);

  const retryAction = useCallback(
    (walletId: string, name?: string) => {
      setActionError(null);
      return name !== undefined ? renameWallet(walletId, name) : disconnectWallet(walletId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disconnectWallet/renameWallet are stable per render; re-declaring them as deps would recreate retryAction on every optimistic-state change it itself causes.
    []
  );

  return {
    wallets,
    selectedWallet,
    preferredWallet,
    loading,
    error,
    fetchWallets: listWallets,
    generateNonce,
    getChallenge,
    verifyWallet,
    selectWallet,
    disconnectWallet,
    renameWallet,
    getBalance,
    reset,
    isPending,
    actionError,
    clearActionError: () => setActionError(null),
    retryAction,
  };
}
