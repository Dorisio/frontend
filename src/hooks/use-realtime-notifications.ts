/**
 * useRealtimeNotifications Hook (#11)
 *
 * Subscribes to a creator's tip events over a native WebSocket, so the
 * dashboard updates the moment a tip arrives instead of requiring a manual
 * refresh. Connects to `${SDK_WS_URL}/creators/${creatorId}`, reconnects
 * with exponential backoff (100ms -> 30s) on an unexpected close, shows a
 * toast via the app's existing notification store, and invalidates the
 * React Query cache key the transaction history hook reads from so the
 * dashboard's transaction list picks up the new tip on its next render.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app-store';

export interface TipNotification {
  id: string;
  amount: number;
  tipperName?: string;
  message?: string;
  createdAt: string;
}

interface UseRealtimeNotificationsResult {
  notifications: TipNotification[];
  isConnected: boolean;
  error: string | null;
}

const INITIAL_BACKOFF_MS = 100;
const MAX_BACKOFF_MS = 30_000;

function getWebSocketUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_SDK_WS_URL;
  return base ? base.replace(/\/$/, '') : null;
}

/**
 * Validates an incoming message before it is ever treated as a tip. A
 * malformed or unexpected payload (wrong shape, wrong type, a field
 * missing) is dropped rather than partially trusted, since it drives a
 * cache invalidation and a user-visible toast.
 */
function parseTipMessage(raw: string): TipNotification | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const candidate = data as Record<string, unknown>;
  if (candidate.type !== undefined && candidate.type !== 'tip') {
    // Other event types may be sent on the same connection in the future;
    // only 'tip' (or an untyped legacy payload) is handled here.
    return null;
  }
  if (typeof candidate.id !== 'string' || typeof candidate.amount !== 'number') {
    return null;
  }
  if (!Number.isFinite(candidate.amount) || candidate.amount <= 0) {
    return null;
  }

  return {
    id: candidate.id,
    amount: candidate.amount,
    tipperName: typeof candidate.tipperName === 'string' ? candidate.tipperName : undefined,
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
  };
}

export function useRealtimeNotifications(
  creatorId: string | null | undefined
): UseRealtimeNotificationsResult {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  const [notifications, setNotifications] = useState<TipNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const closedByClientRef = useRef(false);

  const connect = useCallback(() => {
    if (!creatorId) return;

    const wsBase = getWebSocketUrl();
    if (!wsBase) {
      // No WebSocket endpoint configured: degrade gracefully rather than
      // throwing or retrying forever against an empty URL.
      setError('Real-time notifications are unavailable.');
      setIsConnected(false);
      return;
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${wsBase}/creators/${encodeURIComponent(creatorId)}`);
    } catch {
      setError('Failed to open real-time connection.');
      setIsConnected(false);
      return;
    }
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setIsConnected(true);
      setError(null);
      backoffRef.current = INITIAL_BACKOFF_MS;
    });

    socket.addEventListener('message', (event: MessageEvent) => {
      const tip = parseTipMessage(String(event.data));
      if (!tip) return;

      setNotifications((prev) => [tip, ...prev]);

      addNotification({
        type: 'success',
        title: 'New tip received',
        message: tip.tipperName
          ? `${tip.tipperName} sent you $${tip.amount.toFixed(2)}`
          : `You received a $${tip.amount.toFixed(2)} tip`,
      });

      void queryClient.invalidateQueries({ queryKey: ['transactionHistory', creatorId] });
      void queryClient.invalidateQueries({ queryKey: ['creatorBalance', creatorId] });
    });

    socket.addEventListener('error', () => {
      setError('Real-time connection error.');
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      socketRef.current = null;

      if (closedByClientRef.current) return;

      // Exponential backoff: 100ms, 200ms, 400ms, ... capped at 30s.
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    });
  }, [creatorId, queryClient, addNotification]);

  useEffect(() => {
    closedByClientRef.current = false;
    backoffRef.current = INITIAL_BACKOFF_MS;
    connect();

    return () => {
      closedByClientRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [connect]);

  return { notifications, isConnected, error };
}
