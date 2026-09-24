/**
 * useWallet Hook
 * Wrapper around SDK's useWallet hook
 */

import { useCallback, useMemo, useState } from 'react';
import { useWallet as sdkUseWallet } from 'dorisio-sdk/react';

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

/**
 * Optimistic overlay applied on top of the SDK's wallet list, keyed by
 * wallet id (#6). `disconnected: true` hides a wallet from the list
 * immediately; a `name` override renders a pending rename before the
 * server confirms it. Rolled back (the entry removed) if the underlying
 * SDK call throws.
 */
type OptimisticEntry = { disconnected?: true; name?: string };

export function useWallet() {
  const {
    wallets: sdkWallets,
    selectedWallet: sdkSelectedWallet,
    loading,
    error,
    generateNonce,
    getChallenge,
    verifyWallet,
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

  const selectWallet = (wallet: WalletInfo) => {
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
