import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { useSafeTimeout } from '@/hooks/use-timeout';
import { NotificationProvider } from '@/components/notification-provider';
import { useAppStore } from '@/stores/app-store';

/**
 * A pending timer is one of the most common frontend leak vectors: the
 * callback closes over component state, so the closure (and its references)
 * is retained until the timer fires, and it calls setState after unmount.
 * These tests assert the two patterns used across the app actually clear
 * their timers.
 */
describe('timer cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useSafeTimeout', () => {
    it('tracks scheduled timers and clears them on unmount', () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() => useSafeTimeout());

      act(() => {
        result.current.schedule(callback, 1000);
        result.current.schedule(callback, 2000);
      });
      expect(vi.getTimerCount()).toBe(2);

      unmount();

      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(5000);
      expect(callback).not.toHaveBeenCalled();
    });

    it('drops a timer handle once it has fired', () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() => useSafeTimeout());

      act(() => {
        result.current.schedule(callback, 500);
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('cancels individual timers and all timers on demand', () => {
      const first = vi.fn();
      const second = vi.fn();
      const { result, unmount } = renderHook(() => useSafeTimeout());

      let firstId: ReturnType<typeof setTimeout>;
      act(() => {
        firstId = result.current.schedule(first, 1000);
        result.current.schedule(second, 1000);
      });

      act(() => {
        result.current.cancel(firstId);
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.schedule(first, 1000);
        result.current.cancelAll();
      });
      expect(vi.getTimerCount()).toBe(0);

      unmount();
    });
  });

  describe('NotificationProvider', () => {
    beforeEach(() => {
      useAppStore.setState({ notifications: [] });
    });

    it('clears every toast timer when the provider unmounts', () => {
      act(() => {
        useAppStore.getState().addNotification({ type: 'info', message: 'first' });
        useAppStore.getState().addNotification({ type: 'success', message: 'second' });
      });

      const { unmount } = render(<NotificationProvider />);
      expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('app store notification cap', () => {
    it('evicts the oldest toast once the cap is exceeded', () => {
      useAppStore.setState({ notifications: [] });
      act(() => {
        for (let i = 0; i < 80; i++) {
          useAppStore.getState().addNotification({ type: 'info', message: `toast-${i}` });
        }
      });

      const { notifications } = useAppStore.getState();
      expect(notifications.length).toBeLessThanOrEqual(50);
      expect(notifications[notifications.length - 1].message).toBe('toast-79');
      expect(notifications.some((n) => n.message === 'toast-0')).toBe(false);

      useAppStore.setState({ notifications: [] });
    });
  });
});
