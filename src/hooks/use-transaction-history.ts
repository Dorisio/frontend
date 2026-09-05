/**
 * useTransactionHistory Hook
 * Wrapper around SDK's useTransactionHistory hook
 */

import { useTransactionHistory as sdkUseTransactionHistory } from 'dorisio-sdk/react';

export interface Transaction {
  id: string;
  creatorId?: string;
  senderId?: string;
  senderUsername?: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  transactionHash?: string;
}

export function useTransactionHistory(
  creatorId: string | null | undefined,
  initialPage = 1,
  initialPageSize = 10
) {
  const {
    transactions: sdkTransactions,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchHistory,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch,
    reset,
  } = sdkUseTransactionHistory({ page: initialPage, pageSize: initialPageSize });

  // Map SDK transactions to frontend format
  const transactions: Transaction[] = sdkTransactions.map((t: any) => ({
    id: t.id,
    creatorId: t.creatorId,
    senderId: t.senderId,
    senderUsername: t.senderUsername,
    amount: t.amount,
    message: t.message,
    status: t.status,
    createdAt: t.createdAt,
    transactionHash: t.transactionHash,
  }));

  return {
    transactions,
    total,
    page,
    pageSize,
    loading,
    error,
    fetchTransactions: fetchHistory,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch,
    reset,
  };
}
