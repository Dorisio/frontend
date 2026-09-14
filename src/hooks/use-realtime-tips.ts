/**
 * useRealtimeTips Hook
 * Provides real-time tip updates via polling or websocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface TipNotification {
  id: string;
  amount: number;
  message?: string;
  creatorName?: string;
  timestamp: Date;
  isNew: boolean;
}

interface UseRealtimeTipsOptions {
  creatorId?: string;
  pollingInterval?: number; // ms, 0 to disable polling
  enableWebSocket?: boolean;
  onTipReceived?: (tip: TipNotification) => void;
}

export function useRealtimeTips({
  creatorId,
  pollingInterval = 5000, // Default 5 seconds
  enableWebSocket = false,
  onTipReceived,
}: UseRealtimeTipsOptions) {
  const queryClient = useQueryClient();
  const [tips, setTips] = useState<TipNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();
  const webSocketRef = useRef<WebSocket | null>(null);
  const unreadCountRef = useRef(0);

  // Start polling for new tips
  const startPolling = useCallback(async () => {
    if (!creatorId || pollingInterval === 0) return;

    const pollTips = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch(
        //   `/api/creators/${creatorId}/tips?since=${new Date(Date.now() - pollingInterval).toISOString()}`
        // );
        // if (!response.ok) throw new Error('Failed to fetch tips');
        // const data = await response.json();

        // Simulate API response for now
        const data = { tips: [] };

        if (data.tips && data.tips.length > 0) {
          setError(null);
          const newTips = data.tips.map((tip: any) => ({
            id: tip.id,
            amount: tip.amount,
            message: tip.message,
            creatorName: tip.creatorName,
            timestamp: new Date(tip.createdAt),
            isNew: true,
          }));

          setTips((prev) => [...newTips, ...prev]);
          unreadCountRef.current += newTips.length;

          // Callback and trigger query cache invalidation
          newTips.forEach((tip) => {
            onTipReceived?.(tip);
            queryClient.invalidateQueries({
              queryKey: ['transactionHistory', creatorId],
            });
          });

          // Mark as read after 3 seconds
          setTimeout(() => {
            setTips((prev) =>
              prev.map((t) => (newTips.some((nt) => nt.id === t.id) ? { ...t, isNew: false } : t))
            );
          }, 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tips');
      }

      pollingTimeoutRef.current = setTimeout(pollTips, pollingInterval);
    };

    pollTips();
  }, [creatorId, pollingInterval, onTipReceived, queryClient]);

  // Start websocket connection
  const startWebSocket = useCallback(() => {
    if (!creatorId || !enableWebSocket) return;

    try {
      // TODO: Replace with actual websocket endpoint
      // const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/tips/${creatorId}`;
      // const ws = new WebSocket(wsUrl);

      // For now, simulate websocket with polling
      const ws = {
        addEventListener: () => {},
        removeEventListener: () => {},
        send: () => {},
        close: () => {},
      } as any;

      ws.addEventListener('open', () => {
        setIsConnected(true);
        setError(null);
      });

      ws.addEventListener('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          const tip: TipNotification = {
            id: data.id,
            amount: data.amount,
            message: data.message,
            creatorName: data.creatorName,
            timestamp: new Date(data.createdAt),
            isNew: true,
          };

          setTips((prev) => [tip, ...prev]);
          unreadCountRef.current += 1;

          onTipReceived?.(tip);
          queryClient.invalidateQueries({
            queryKey: ['transactionHistory', creatorId],
          });

          // Mark as read after 3 seconds
          setTimeout(() => {
            setTips((prev) =>
              prev.map((t) => (t.id === tip.id ? { ...t, isNew: false } : t))
            );
          }, 3000);
        } catch (err) {
          console.error('Failed to parse websocket message:', err);
        }
      });

      ws.addEventListener('error', () => {
        setError('WebSocket connection error');
        setIsConnected(false);
      });

      ws.addEventListener('close', () => {
        setIsConnected(false);
      });

      webSocketRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect websocket');
    }
  }, [creatorId, enableWebSocket, onTipReceived, queryClient]);

  // Initialize polling or websocket
  useEffect(() => {
    if (!creatorId) return;

    if (enableWebSocket) {
      startWebSocket();
    } else if (pollingInterval > 0) {
      startPolling();
    }

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, [creatorId, enableWebSocket, pollingInterval, startPolling, startWebSocket]);

  const clearTips = useCallback(() => {
    setTips([]);
    unreadCountRef.current = 0;
  }, []);

  const dismissTip = useCallback((tipId: string) => {
    setTips((prev) => prev.filter((t) => t.id !== tipId));
  }, []);

  const getUnreadCount = useCallback(() => {
    return unreadCountRef.current;
  }, []);

  return {
    tips,
    isConnected,
    error,
    unreadCount: getUnreadCount(),
    clearTips,
    dismissTip,
  };
}
