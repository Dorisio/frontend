/**
 * useRealtimeTips Hook
 * Provides real-time tip updates via polling or websocket
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeTimeout } from '@/hooks/use-timeout';

/**
 * Upper bound on the number of tips retained in state. Without a cap, a long
 * session keeps every tip ever polled/received in memory, which is a slow but
 * unbounded leak. Older entries are dropped first (newest are prepended).
 */
const MAX_TIPS = 200;

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
}: UseRealtimeTipsOptions): {
  tips: TipNotification[];
  isConnected: boolean;
  error: string | null;
  unreadCount: number;
  clearTips: () => void;
  dismissTip: (tipId: string) => void;
} {
  const queryClient = useQueryClient();
  const { schedule, cancelAll } = useSafeTimeout();
  const [tips, setTips] = useState<TipNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout>();
  const webSocketRef = useRef<WebSocket | null>(null);
  const unreadCountRef = useRef(0);

  const prependTips = useCallback((incoming: TipNotification[]) => {
    setTips((prev) => [...incoming, ...prev].slice(0, MAX_TIPS));
  }, []);

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
        const data: {
          tips: Array<{
            id: string;
            amount: number;
            message?: string;
            creatorName?: string;
            createdAt: string;
          }>;
        } = { tips: [] };

        if (data.tips && data.tips.length > 0) {
          setError(null);
          const newTips = data.tips.map((tip) => ({
            id: tip.id,
            amount: tip.amount,
            message: tip.message,
            creatorName: tip.creatorName,
            timestamp: new Date(tip.createdAt),
            isNew: true,
          }));

          prependTips(newTips);
          unreadCountRef.current += newTips.length;

          // Callback and trigger query cache invalidation
          newTips.forEach((tip) => {
            onTipReceived?.(tip);
            queryClient.invalidateQueries({
              queryKey: ['transactionHistory', creatorId],
            });
          });

          // Mark as read after 3 seconds. Scheduled through useSafeTimeout so
          // it is cleared if the hook unmounts (or creatorId changes) first.
          const ids = new Set(newTips.map((nt) => nt.id));
          schedule(() => {
            setTips((prev) => prev.map((t) => (ids.has(t.id) ? { ...t, isNew: false } : t)));
          }, 3000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tips');
      }

      pollingTimeoutRef.current = setTimeout(pollTips, pollingInterval);
    };

    pollTips();
  }, [creatorId, pollingInterval, onTipReceived, queryClient, prependTips, schedule]);

  // Start websocket connection
  const startWebSocket = useCallback(() => {
    if (!creatorId || !enableWebSocket) return;

    try {
      // TODO: Replace with actual websocket endpoint
      // const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/tips/${creatorId}`;
      // const ws = new WebSocket(wsUrl);

      // For now, simulate websocket with polling
      const ws: Partial<WebSocket> = {
        addEventListener: () => {},
        removeEventListener: () => {},
        send: () => {},
        close: () => {},
      };

      ws.addEventListener?.('open', () => {
        setIsConnected(true);
        setError(null);
      });

      ws.addEventListener?.('message', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as {
            id: string;
            amount: number;
            message?: string;
            creatorName?: string;
            createdAt: string;
          };
          const tip: TipNotification = {
            id: data.id,
            amount: data.amount,
            message: data.message,
            creatorName: data.creatorName,
            timestamp: new Date(data.createdAt),
            isNew: true,
          };

          prependTips([tip]);
          unreadCountRef.current += 1;

          onTipReceived?.(tip);
          queryClient.invalidateQueries({
            queryKey: ['transactionHistory', creatorId],
          });

          // Mark as read after 3 seconds (tracked so it is cleared on unmount).
          const tipId = tip.id;
          schedule(() => {
            setTips((prev) => prev.map((t) => (t.id === tipId ? { ...t, isNew: false } : t)));
          }, 3000);
        } catch (err) {
          console.error('Failed to parse websocket message:', err);
        }
      });

      ws.addEventListener?.('error', () => {
        setError('WebSocket connection error');
        setIsConnected(false);
      });

      ws.addEventListener?.('close', () => {
        setIsConnected(false);
      });

      webSocketRef.current = ws as WebSocket;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect websocket');
    }
  }, [creatorId, enableWebSocket, onTipReceived, queryClient, prependTips, schedule]);

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
      // Clear any pending "mark as read" timers from the previous run so
      // they cannot outlive the effect or retain stale tip arrays.
      cancelAll();
    };
  }, [creatorId, enableWebSocket, pollingInterval, startPolling, startWebSocket, cancelAll]);

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
