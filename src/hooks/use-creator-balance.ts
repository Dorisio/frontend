/**
 * useCreatorBalance Hook
 * Fetches creator earnings and balance
 */

import { useState, useCallback, useEffect } from 'react';
import { useSDKClient } from '@/lib/sdk-client';

export interface CreatorBalance {
  totalEarnings: number;
  pendingBalance: number;
  availableBalance?: number;
}

interface UseCreatorBalanceState {
  balance: CreatorBalance | null;
  loading: boolean;
  error: string | null;
}

export function useCreatorBalance(creatorId: string | null | undefined) {
  const sdk = useSDKClient();
  const [state, setState] = useState<UseCreatorBalanceState>({
    balance: null,
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    if (!creatorId) return;

    setState({ loading: true, error: null, balance: null });

    try {
      const earnings = await sdk.getCreatorEarnings(creatorId);
      const balance: CreatorBalance = {
        totalEarnings: earnings.total || 0,
        pendingBalance: earnings.pending || 0,
        availableBalance: (earnings.total || 0) - (earnings.pending || 0),
      };

      setState({ loading: false, error: null, balance });
      return balance;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch creator balance';
      setState({ loading: false, error, balance: null });
      throw err;
    }
  }, [sdk, creatorId]);

  const refetch = useCallback(async () => {
    return fetchBalance();
  }, [fetchBalance]);

  // Auto-fetch on mount or when creatorId changes
  useEffect(() => {
    if (creatorId) {
      fetchBalance();
    }
  }, [creatorId, fetchBalance]);

  return {
    ...state,
    fetchBalance,
    refetch,
  };
}
