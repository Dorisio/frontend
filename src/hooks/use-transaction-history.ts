/**
 * useTransactionHistory Hook
 * Fetches and manages transaction history with pagination
 */

import { useState, useCallback, useEffect } from 'react';
import { useSDKClient } from '@/lib/sdk-client';

export interface Transaction {
  id: string;
  creatorId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  transactionHash?: string;
}

interface UseTransactionHistoryState {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
}

export function useTransactionHistory(creatorId: string | null | undefined, initialPage = 1, initialPageSize = 10) {
  const sdk = useSDKClient();
  const [state, setState] = useState<UseTransactionHistoryState>({
    transactions: [],
    total: 0,
    page: initialPage,
    pageSize: initialPageSize,
    loading: false,
    error: null,
  });

  const fetchTransactions = useCallback(
    async (page = initialPage, pageSize = initialPageSize) => {
      if (!creatorId) return;

      setState((s) => ({ ...s, loading: true, error: null }));

      try {
        const history = await sdk.getCreatorTipsReceived(creatorId, {
          page,
          pageSize,
        });

        const transactions: Transaction[] = (history.transactions || []).map((t: any) => ({
          id: t.id,
          creatorId: t.creatorId,
          amount: t.amount,
          message: t.message,
          status: t.status,
          createdAt: t.createdAt,
          transactionHash: t.stellarTxHash,
        }));

        setState({
          transactions,
          total: history.total || 0,
          page: history.page || page,
          pageSize: history.pageSize || pageSize,
          loading: false,
          error: null,
        });

        return transactions;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to fetch transaction history';
        setState((s) => ({ ...s, error, loading: false }));
        throw err;
      }
    },
    [sdk, creatorId, initialPage, initialPageSize]
  );

  const goToPage = useCallback(
    async (page: number) => {
      await fetchTransactions(page, state.pageSize);
    },
    [fetchTransactions, state.pageSize]
  );

  const nextPage = useCallback(async () => {
    const maxPage = Math.ceil(state.total / state.pageSize);
    if (state.page < maxPage) {
      await goToPage(state.page + 1);
    }
  }, [goToPage, state.page, state.pageSize, state.total]);

  const prevPage = useCallback(async () => {
    if (state.page > 1) {
      await goToPage(state.page - 1);
    }
  }, [goToPage, state.page]);

  // Auto-fetch on mount
  useEffect(() => {
    if (creatorId) {
      fetchTransactions();
    }
  }, [creatorId, fetchTransactions]);

  return {
    ...state,
    fetchTransactions,
    goToPage,
    nextPage,
    prevPage,
  };
}
