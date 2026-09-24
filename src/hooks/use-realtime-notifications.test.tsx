import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useRealtimeNotifications } from './use-realtime-notifications';
import { useAppStore } from '@/stores/app-store';

/**
 * A minimal, controllable WebSocket test double. Real browsers (and
 * therefore the hook under test) drive the connection lifecycle entirely
 * through the constructor + event listeners, so this fakes exactly that
 * surface: `readyState`, `close()`, and the four events the hook attaches
 * to (open, message, error, close). Each instance is tracked on the
 * module-level `instances` array so a test can reach into "the socket the
 * hook most recently created" and simulate server behavior on it.
 */
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
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
    for (const listener of this.listeners[type] ?? []) {
      listener(event);
    }
  }

  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.dispatch('open');
  }

  simulateMessage(data: unknown): void {
    this.dispatch('message', { data: typeof data === 'string' ? data : JSON.stringify(data) });
  }

  simulateError(): void {
    this.dispatch('error');
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close');
  }

  /** Simulates the server dropping the connection (not a client-initiated close). */
  simulateServerClose(): void {
    this.readyState = MockWebSocket.CLOSED;
    this.dispatch('close');
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useRealtimeNotifications (#11)', () => {
  const originalWebSocket = globalThis.WebSocket;
  const originalEnv = process.env.NEXT_PUBLIC_SDK_WS_URL;

  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    process.env.NEXT_PUBLIC_SDK_WS_URL = 'wss://api.example.test/ws';
    useAppStore.setState({ notifications: [] });
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    process.env.NEXT_PUBLIC_SDK_WS_URL = originalEnv;
    vi.useRealTimers();
  });

  it('connects to the correct URL for the given creator', () => {
    renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('wss://api.example.test/ws/creators/creator-123');
  });

  it('does not connect when creatorId is not provided', () => {
    renderHook(() => useRealtimeNotifications(undefined), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(0);
  });

  it('reports isConnected once the socket opens', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });
    expect(result.current.isConnected).toBe(false);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('adds a valid tip message to notifications and shows a toast with the tipper and amount', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({
        id: 'tip-1',
        amount: 12.5,
        tipperName: 'alice',
        createdAt: '2026-08-01T00:00:00.000Z',
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({ id: 'tip-1', amount: 12.5 });

    const toasts = useAppStore.getState().notifications;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('alice sent you $12.50');
    expect(toasts[0].type).toBe('success');
  });

  it('falls back to a generic toast message when no tipper name is provided', () => {
    renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-1', amount: 5 });
    });

    expect(useAppStore.getState().notifications[0].message).toBe('You received a $5.00 tip');
  });

  it('invalidates the transaction history and balance query caches on a new tip', () => {
    let invalidateSpy!: ReturnType<typeof vi.spyOn>;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useRealtimeNotifications('creator-123'), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-1', amount: 5 });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['transactionHistory', 'creator-123'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['creatorBalance', 'creator-123'] });
  });

  it('rejects a message with a negative or zero amount without adding a notification', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-1', amount: -5 });
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-2', amount: 0 });
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('rejects malformed JSON and messages missing required fields', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage('not json');
      MockWebSocket.instances[0].simulateMessage({ amount: 5 }); // missing id
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-1' }); // missing amount
      MockWebSocket.instances[0].simulateMessage({ id: 'tip-1', amount: 'five' }); // wrong type
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('ignores messages with an event type other than "tip"', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateMessage({
        type: 'ping',
        id: 'tip-1',
        amount: 5,
      });
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('sets an error and marks the connection as not connected on a socket error', () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateError();
    });

    expect(result.current.error).toBe('Real-time connection error.');
  });

  it('reconnects with exponential backoff after an unexpected close', () => {
    renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });
    expect(MockWebSocket.instances).toHaveLength(1);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
      MockWebSocket.instances[0].simulateServerClose();
    });
    expect(MockWebSocket.instances).toHaveLength(1); // not yet reconnected

    act(() => {
      vi.advanceTimersByTime(100); // first backoff: 100ms
    });
    expect(MockWebSocket.instances).toHaveLength(2);

    act(() => {
      MockWebSocket.instances[1].simulateServerClose();
    });
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(MockWebSocket.instances).toHaveLength(2); // 200ms backoff not yet elapsed
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it('resets the backoff to the initial delay after a successful reconnect', () => {
    renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    act(() => {
      MockWebSocket.instances[0].simulateServerClose();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(MockWebSocket.instances).toHaveLength(2);

    act(() => {
      MockWebSocket.instances[1].simulateOpen();
      MockWebSocket.instances[1].simulateServerClose();
    });
    // Backoff reset to 100ms on open, so the next reconnect fires at 100ms
    // again rather than continuing to escalate (200ms).
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it('caps the backoff delay at 30 seconds', () => {
    renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    // Force many consecutive failures: 100, 200, 400, 800, 1600, 3200,
    // 6400, 12800, 25600, then capped at 30000 from here on.
    const delays = [100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600, 30000, 30000];
    for (let i = 0; i < delays.length; i++) {
      act(() => {
        MockWebSocket.instances[i].simulateServerClose();
      });
      act(() => {
        vi.advanceTimersByTime(delays[i]);
      });
    }

    expect(MockWebSocket.instances).toHaveLength(delays.length + 1);
  });

  it('does not reconnect after the component unmounts', () => {
    const { unmount } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });
    const firstSocket = MockWebSocket.instances[0];

    unmount();
    act(() => {
      firstSocket.simulateServerClose();
    });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it('closes the socket on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });
    const socket = MockWebSocket.instances[0];
    const closeSpy = vi.spyOn(socket, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('degrades gracefully with an explicit error when no WebSocket URL is configured', () => {
    delete process.env.NEXT_PUBLIC_SDK_WS_URL;

    const { result } = renderHook(() => useRealtimeNotifications('creator-123'), { wrapper });

    expect(MockWebSocket.instances).toHaveLength(0);
    expect(result.current.error).toBe('Real-time notifications are unavailable.');
    expect(result.current.isConnected).toBe(false);
  });

  it('reconnects to the new creator when creatorId changes', () => {
    const { rerender } = renderHook(({ creatorId }) => useRealtimeNotifications(creatorId), {
      wrapper,
      initialProps: { creatorId: 'creator-1' },
    });

    expect(MockWebSocket.instances[0].url).toContain('creator-1');

    rerender({ creatorId: 'creator-2' });

    expect(MockWebSocket.instances).toHaveLength(2);
    expect(MockWebSocket.instances[1].url).toContain('creator-2');
  });
});

describe('useRealtimeNotifications integration with waitFor (async connection)', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    process.env.NEXT_PUBLIC_SDK_WS_URL = 'wss://api.example.test/ws';
    useAppStore.setState({ notifications: [] });
  });

  afterEach(() => {
    useAppStore.setState({ notifications: [] });
  });

  it('reflects isConnected: true after an async open event, using real timers', async () => {
    const { result } = renderHook(() => useRealtimeNotifications('creator-async'), { wrapper });

    setTimeout(() => MockWebSocket.instances[0].simulateOpen(), 0);

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
