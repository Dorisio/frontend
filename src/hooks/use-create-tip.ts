/**
 * useCreateTip Hook
 * Manages the tip creation flow with SDK integration
 */

import { useState, useCallback } from 'react';
import { useSDKClient } from '@/lib/sdk-client';

export interface CreateTipPayload {
  creatorId: string;
  amount: number;
  message?: string;
}

export interface TipResponse {
  id: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
}

interface UseCreateTipState {
  loading: boolean;
  error: string | null;
  tip: TipResponse | null;
}

export function useCreateTip() {
  const sdk = useSDKClient();
  const [state, setState] = useState<UseCreateTipState>({
    loading: false,
    error: null,
    tip: null,
  });

  const createTip = useCallback(
    async (payload: CreateTipPayload): Promise<TipResponse> => {
      setState({ loading: true, error: null, tip: null });

      try {
        const result = await sdk.createTip({
          creatorId: payload.creatorId,
          amount: payload.amount,
          message: payload.message,
        });

        const tip: TipResponse = {
          id: result.id,
          status: result.status as any,
          transactionHash: result.stellarTxHash,
        };

        setState({ loading: false, error: null, tip });
        return tip;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to create tip';
        setState({ loading: false, error, tip: null });
        throw err;
      }
    },
    [sdk]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, tip: null });
  }, []);

  return {
    ...state,
    createTip,
    reset,
  };
}
