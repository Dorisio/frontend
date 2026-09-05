/**
 * useCreatorBalance Hook
 * Wrapper around SDK's useCreatorBalance hook
 */

import { useCreatorBalance as sdkUseCreatorBalance } from 'dorisio-sdk/react';
import { useEffect } from 'react';

export interface CreatorBalance {
  totalEarnings: number;
  pendingBalance: number;
  availableBalance?: number;
}

export function useCreatorBalance(creatorId: string | null | undefined) {
  const {
    balance: sdkBalance,
    loading,
    error,
    fetchBalance: sdkFetchBalance,
    refetch,
    reset,
  } = sdkUseCreatorBalance(creatorId || undefined);

  // Map SDK balance to frontend format
  const balance: CreatorBalance | null = sdkBalance
    ? {
        totalEarnings: sdkBalance.totalEarnings || 0,
        pendingBalance: sdkBalance.pendingBalance || 0,
        availableBalance: (sdkBalance.totalEarnings || 0) - (sdkBalance.pendingBalance || 0),
      }
    : null;

  const fetchBalance = async () => {
    return sdkFetchBalance(creatorId || '');
  };

  return {
    balance,
    loading,
    error,
    fetchBalance,
    refetch,
    reset,
  };
}
