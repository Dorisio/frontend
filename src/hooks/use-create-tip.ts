/**
 * useCreateTip Hook
 * Wrapper around SDK's useCreateTip hook with frontend-specific types
 */

import { useCreateTip as sdkUseCreateTip } from 'dorisio-sdk/react';

export interface CreateTipPayload {
  creatorId: string;
  amount: number;
  message?: string;
}

export type TipStatus =
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'creating'
  | 'building'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error';

export interface TipResponse {
  id: string;
  status: TipStatus;
  transactionHash?: string;
  amount?: number;
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

    const resultWithHash = result as unknown as { transactionHash?: string };

    return {
      id: result?.id || '',
      status: ((result?.status || step) as unknown as TipStatus) || 'pending',
      transactionHash: resultWithHash?.transactionHash,
      amount: result?.amount,
    };
  };

  return {
    loading,
    error,
    tip: data
      ? {
          id: data.id || '',
          status: (step as unknown as TipStatus) || 'pending',
          transactionHash: (data as unknown as { transactionHash?: string })?.transactionHash,
          amount: data.amount,
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
