/**
 * useWallet Hook
 * Wrapper around SDK's useWallet hook
 */

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
    renameWallet,
    getBalance,
    reset,
  } = sdkUseWallet();

  // Map SDK wallets to frontend format
  const wallets: WalletInfo[] = sdkWallets.map((w: any) => ({
    id: w.id,
    publicKey: w.publicKey,
    name: w.name,
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

  const selectWallet = (wallet: WalletInfo) => {
    const sdkWallet = sdkWallets.find((w: any) => w.id === wallet.id);
    if (sdkWallet) {
      sdkSelectWallet(sdkWallet);
    }
  };

  const disconnectWallet = async (walletId: string) => {
    await unlinkWallet(walletId);
  };

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
