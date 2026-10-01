import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  useRealtimeNotifications,
  MAX_RETAINED_NOTIFICATIONS,
} from '@/hooks/use-realtime-notifications';
import {
  useActivityFeedRealtime,
  MAX_RETAINED_ACTIVITY_ITEMS,
} from '@/hooks/use-activity-feed-realtime';
import { useRealtimeTips } from '@/hooks/use-realtime-tips';
import { useAppStore } from '@/stores/app-store';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  url: string;
  readyState = 1;
  private listeners: Record<string, Array<(event: unknown) => void>> = {};

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    (this.listeners[type] ??= []).push(listener);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== listener);
  }

  dispatch(type: string, event: unknown = {}): void {
    for (const listener of this.listeners[type] ?? []) listener(event);
  }

  simulateOpen(): void {
    this.readyState = 1;
    this.dispatch('open');
  }

  simulateMessage(data: unknown): void {
    this.dispatch('message', { data: typeof data === 'string' ? data : JSON.stringify(data) });
  }

  close(): void {
    this.readyState = 3;
    this.dispatch('close');
  }
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('realtime hooks retain bounded state', () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalEnv = process.env.NEXT_PUBLIC_SDK_WS_URL;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    process.env.NEXT_PUBLIC_SDK_WS_URL = 'wss://api.example.test/ws';
    useAppStore.setState({ notifications: [] });
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    process.env.NEXT_PUBLIC_SDK_WS_URL = originalEnv;
    useAppStore.setState({ notifications: [] });
    vi.useRealTimers();
  });

  it('caps retained tip notifications at MAX_RETAINED_NOTIFICATIONS', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-1'), { wrapper });
    const socket = MockWebSocket.instances[0];

    act(() => socket.simulateOpen());
    act(() => {
      for (let i = 0; i < MAX_RETAINED_NOTIFICATIONS + 50; i++) {
        socket.simulateMessage({ id: `tip-${i}`, amount: 1 });
      }
    });

    expect(result.current.notifications).toHaveLength(MAX_RETAINED_NOTIFICATIONS);
    // Newest retained, oldest evicted.
    expect(result.current.notifications[0].id).toBe(`tip-${MAX_RETAINED_NOTIFICATIONS + 49}`);
    expect(result.current.notifications.some((n) => n.id === 'tip-0')).toBe(false);
  });

  it('caps retained activity items at MAX_RETAINED_ACTIVITY_ITEMS', () => {
    const { result } = renderHook(() => useActivityFeedRealtime('user-1'), { wrapper });
    const socket = MockWebSocket.instances[0];

    act(() => socket.simulateOpen());
    act(() => {
      for (let i = 0; i < MAX_RETAINED_ACTIVITY_ITEMS + 50; i++) {
        socket.simulateMessage({
          type: 'activity',
          id: `a-${i}`,
          creatorId: 'creator-1',
          creatorName: 'Alice',
          title: 'New tip',
          createdAt: '2026-09-01T00:00:00.000Z',
        });
      }
    });

    expect(result.current.newItems).toHaveLength(MAX_RETAINED_ACTIVITY_ITEMS);
    expect(result.current.newItems[0].id).toBe(`a-${MAX_RETAINED_ACTIVITY_ITEMS + 49}`);
  });

  it('clears the polling timer when useRealtimeTips unmounts', () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(
      () => useRealtimeTips({ creatorId: 'creator-1', pollingInterval: 1000 }),
      { wrapper }
    );

    // The initial poll runs and schedules the next one.
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
