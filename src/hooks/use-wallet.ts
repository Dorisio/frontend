/**
 * useWallet Hook
 * Wrapper around SDK's useWallet hook with comprehensive error handling,
 * automatic retry for transient errors, and user-facing toast notifications.
 */

import { useCallback } from 'react';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';
import { useNotification } from '@/components/notification-provider';

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
    getBalance: sdkGetBalance,
    reset,
  } = sdkUseWallet();

  const { error: toastError, success: toastSuccess } = useNotification();

  // Map SDK wallets to frontend format
  const wallets: WalletInfo[] = sdkWallets.map((w: SDKWallet) => ({
    id: w.id,
    publicKey: w.publicKey,
    name: w.name || undefined,
    verified: w.verified || false,
  }));

  const selectedWallet = sdkSelectedWallet
    ? {
        id: sdkSelectedWallet.id,
        publicKey: sdkSelectedWallet.publicKey,
        name: sdkSelectedWallet.name,
        verified: sdkSelectedWallet.verified || false,
      }
    : null;

  const selectWallet = (wallet: WalletInfo): void => {
    const sdkWallet = sdkWallets.find((w: SDKWallet) => w.id === wallet.id);
    if (sdkWallet) {
      sdkSelectWallet(sdkWallet);
    }
  };

  /** Disconnect (unlink) a wallet. Retries on transient errors. */
  const disconnectWallet = useCallback(
    async (walletId: string): Promise<void> => {
      try {
        await withRetry(() => unlinkWallet(walletId));
        toastSuccess('Wallet disconnected successfully.', 'Wallet Removed');
      } catch (err) {
        const message = mapWalletError(err);
        console.error('[useWallet] disconnectWallet failed:', err);
        toastError(message, 'Disconnect Failed');
        throw new Error(message);
      }
    },
    [unlinkWallet, toastSuccess, toastError]
  );

  /** Rename a wallet. Retries on transient errors. */
  const renameWallet = useCallback(
    async (walletId: string, name: string): Promise<void> => {
      try {
        await withRetry(() => sdkRenameWallet(walletId, name));
        toastSuccess('Wallet renamed successfully.', 'Wallet Updated');
      } catch (err) {
        const message = mapWalletError(err);
        console.error('[useWallet] renameWallet failed:', err);
        toastError(message, 'Rename Failed');
        throw new Error(message);
      }
    },
    [sdkRenameWallet, toastSuccess, toastError]
  );

  /** Verify a wallet via signed challenge. Retries on transient errors. */
  const verifyWallet = useCallback(
    async (...args: Parameters<typeof sdkVerifyWallet>): Promise<ReturnType<typeof sdkVerifyWallet>> => {
      try {
        const result = await withRetry(() => sdkVerifyWallet(...args));
        toastSuccess('Wallet verified successfully!', 'Wallet Verified');
        return result;
      } catch (err) {
        const message = mapWalletError(err);
        console.error('[useWallet] verifyWallet failed:', err);
        toastError(message, 'Verification Failed');
        throw new Error(message);
      }
    },
    [sdkVerifyWallet, toastSuccess, toastError]
  );

  /** Get wallet balance. Retries on transient errors. */
  const getBalance = useCallback(
    async (...args: Parameters<typeof sdkGetBalance>): Promise<ReturnType<typeof sdkGetBalance>> => {
      try {
        return await withRetry(() => sdkGetBalance(...args));
      } catch (err) {
        const message = mapWalletError(err);
        console.error('[useWallet] getBalance failed:', err);
        toastError(message, 'Balance Unavailable');
        throw new Error(message);
      }
    },
    [sdkGetBalance, toastError]
  );

  return {
    wallets,
    selectedWallet,
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
  };
}
