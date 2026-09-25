/**
 * useCreateTip Hook
 * Wrapper around SDK's useCreateTip hook with frontend-specific types
 */

import { useCreateTip as sdkUseCreateTip } from 'dorisio-sdk/react';
import type { Transaction } from 'dorisio-sdk';

export interface CreateTipPayload {
  creatorId: string;
  amount: number;
  message?: string;
}

export const TIP_STATUSES = [
  'pending',
  'confirmed',
  'failed',
  'creating',
  'building',
  'submitting',
  'confirming',
  'success',
  'error',
] as const;

export type TipStatus = (typeof TIP_STATUSES)[number];

export interface TipResponse {
  id?: string;
  status: TipStatus;
  transactionHash?: string;
  amount?: number;
}

function isTipStatus(value: string | null | undefined): value is TipStatus {
  return typeof value === 'string' && TIP_STATUSES.some((status) => status === value);
}

function toTipStatus(...values: Array<string | null | undefined>): TipStatus {
  for (const value of values) {
    if (isTipStatus(value)) {
      return value;
    }
  }
  return 'pending';
}

function toTransactionHash(result: Transaction | null | undefined): string | undefined {
  const hash = result?.stellarTxHash;
  return typeof hash === 'string' && hash.length > 0 ? hash : undefined;
}

export function useCreateTip() {
  const {
    createTip: sdkCreateTip,
    buildTransaction,
    submitTransaction,
    confirmTransaction,
    data,
    loading,
    error,
    step,
    reset,
  } = sdkUseCreateTip();

  const createTip = async (payload: CreateTipPayload): Promise<TipResponse> => {
    const result = await sdkCreateTip({
      creatorId: payload.creatorId,
      amount: payload.amount,
      message: payload.message,
    });

    return {
      id: result?.id,
      status: toTipStatus(result?.status, step),
      transactionHash: toTransactionHash(result),
      amount: result?.amount,
    };
  };

  return {
    loading,
    error,
    tip: data
      ? {
          id: data?.id,
          status: toTipStatus(data?.status, step),
          transactionHash: toTransactionHash(data),
          amount: data?.amount,
        }
      : null,
    createTip,
    buildTransaction,
    submitTransaction,
    confirmTransaction,
    reset,
    step,
  };
}