/**
 * useWallet Hook
 * Manages wallet operations with the SDK
 */

import { useState, useCallback, useEffect } from 'react';
import { useSDKClient } from '@/lib/sdk-client';
import { useAuthStore } from '@/stores/auth-store';

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

interface UseWalletState {
  wallets: WalletInfo[];
  selectedWallet: WalletInfo | null;
  loading: boolean;
  error: string | null;
}

export function useWallet() {
  const sdk = useSDKClient();
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState<UseWalletState>({
    wallets: [],
    selectedWallet: null,
    loading: false,
    error: null,
  });

  // Fetch wallets
  const fetchWallets = useCallback(async () => {
    if (!user) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const wallets = await sdk.getWallets(user.id);
      const walletList: WalletInfo[] = wallets.map((w: any) => ({
        id: w.id,
        publicKey: w.publicKey,
        name: w.name,
        verified: w.verified,
      }));

      setState((s) => ({
        ...s,
        wallets: walletList,
        selectedWallet: walletList[0] || null,
        loading: false,
      }));

      return walletList;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch wallets';
      setState((s) => ({ ...s, error, loading: false }));
      throw err;
    }
  }, [sdk, user]);

  // Get wallet balance
  const getBalance = useCallback(
    async (walletId: string) => {
      try {
        const balance = await sdk.getWalletBalance(walletId);
        return balance;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to fetch balance';
        throw new Error(error);
      }
    },
    [sdk]
  );

  // Disconnect wallet
  const disconnectWallet = useCallback(
    async (walletId: string) => {
      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        await sdk.disconnectWallet(walletId);
        setState((s) => ({
          ...s,
          wallets: s.wallets.filter((w) => w.id !== walletId),
          selectedWallet:
            s.selectedWallet?.id === walletId ? s.wallets[0] || null : s.selectedWallet,
          loading: false,
        }));
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to disconnect wallet';
        setState((s) => ({ ...s, error, loading: false }));
        throw err;
      }
    },
    [sdk]
  );

  // Select wallet
  const selectWallet = useCallback((wallet: WalletInfo) => {
    setState((s) => ({ ...s, selectedWallet: wallet }));
  }, []);

  // Auto-fetch wallets on mount
  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user, fetchWallets]);

  return {
    ...state,
    fetchWallets,
    getBalance,
    disconnectWallet,
    selectWallet,
  };
}
