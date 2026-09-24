/**
 * Wallet Preference Store
 * Persists the user's default wallet and last-used wallet per creator
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletPreferenceStore {
  /** Wallet to auto-select when no per-creator history exists. */
  defaultWalletId: string | null;
  /** Last wallet used to tip a given creator, keyed by creatorId. */
  lastUsedWalletByCreator: Record<string, string>;

  setDefaultWalletId: (walletId: string | null) => void;
  setLastUsedWallet: (creatorId: string, walletId: string) => void;
  getPreferredWalletId: (creatorId: string) => string | null;
}

export const useWalletPreferenceStore = create<WalletPreferenceStore>()(
  persist(
    (set, get) => ({
      defaultWalletId: null,
      lastUsedWalletByCreator: {},

      setDefaultWalletId: (walletId) => set({ defaultWalletId: walletId }),

      setLastUsedWallet: (creatorId, walletId) =>
        set((state) => ({
          lastUsedWalletByCreator: {
            ...state.lastUsedWalletByCreator,
            [creatorId]: walletId,
          },
        })),

      getPreferredWalletId: (creatorId) => {
        const state = get();
        return state.lastUsedWalletByCreator[creatorId] || state.defaultWalletId || null;
      },
    }),
    {
      name: 'Dorisio-wallet-preference',
    }
  )
);
