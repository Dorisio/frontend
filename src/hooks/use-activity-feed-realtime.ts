/**
 * useActivityFeedRealtime Hook
 * Subscribes to real-time activity feed updates via WebSocket
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ActivityFeedItem } from '@/types';

interface UseActivityFeedRealtimeResult {
  isConnected: boolean;
  error: string | null;
  newItems: ActivityFeedItem[];
}

const INITIAL_BACKOFF_MS = 100;
const MAX_BACKOFF_MS = 30_000;

/** Cap on retained realtime activity items (long-lived sessions). */
export const MAX_RETAINED_ACTIVITY_ITEMS = 100;

function getWebSocketUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_SDK_WS_URL;
  return base ? base.replace(/\/$/, '') : null;
}

/**
 * Validates an incoming activity message before processing it
 */
function parseActivityMessage(raw: string): ActivityFeedItem | null {
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
  if (candidate.type !== 'activity') {
    return null;
  }

  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.type !== 'string' ||
    typeof candidate.creatorId !== 'string' ||
    typeof candidate.creatorName !== 'string' ||
    typeof candidate.title !== 'string' ||
    typeof candidate.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    type: candidate.type as ActivityFeedItem['type'],
    creatorId: candidate.creatorId,
    creatorName: candidate.creatorName,
    creatorAvatar: typeof candidate.creatorAvatar === 'string' ? candidate.creatorAvatar : undefined,
    title: candidate.title,
    description: typeof candidate.description === 'string' ? candidate.description : undefined,
    amount: typeof candidate.amount === 'number' ? candidate.amount : undefined,
    isPublic: typeof candidate.isPublic === 'boolean' ? candidate.isPublic : undefined,
    createdAt: candidate.createdAt,
    data: typeof candidate.data === 'object' && candidate.data !== null ? (candidate.data as Record<string, unknown>) : undefined,
  };
}

export function useActivityFeedRealtime(userId: string | null | undefined): UseActivityFeedRealtimeResult {
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItems, setNewItems] = useState<ActivityFeedItem[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const closedByClientRef = useRef(false);

  const connect = useCallback((): void => {
    if (!userId) return;

    const wsBase = getWebSocketUrl();
    if (!wsBase) {
      setError('Real-time activity updates are unavailable.');
      setIsConnected(false);
      return;
    }

    let socket: WebSocket;
    try {
      socket = new WebSocket(`${wsBase}/activity/${encodeURIComponent(userId)}`);
    } catch {
      setError('Failed to open real-time activity connection.');
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
      const activity = parseActivityMessage(String(event.data));
      if (!activity) return;

      setNewItems((prev) => [activity, ...prev].slice(0, MAX_RETAINED_ACTIVITY_ITEMS));

      // Invalidate the activity feed query to trigger a refetch
      void queryClient.invalidateQueries({ queryKey: ['activityFeed'] });
    });

    socket.addEventListener('error', () => {
      setError('Real-time activity connection error.');
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      socketRef.current = null;

      if (closedByClientRef.current) return;

      // Exponential backoff: 100ms, 200ms, 400ms, ... capped at 30s
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    });
  }, [userId, queryClient]);

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

  return { isConnected, error, newItems };
}
