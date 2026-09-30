'use client';

/**
 * useSafeTimeout
 *
 * A `setTimeout` wrapper that tracks every pending timer and clears them
 * automatically when the component unmounts. Use this instead of a bare
 * `setTimeout` in components/effects that fire state updates later (e.g. "hide
 * this success banner after 4s").
 *
 * Why: a bare `setTimeout` whose callback closes over component state keeps
 * that component's closure (and whatever it references) alive until the timer
 * fires, and calls `setState` after unmount. Repeated across a long session
 * these accumulate. See docs/MEMORY_LEAK_PITFALLS.md.
 */

import { useCallback, useEffect, useRef } from 'react';

export type SafeTimeoutId = ReturnType<typeof setTimeout>;

export interface SafeTimeoutApi {
  /** Schedule `callback` and track the handle for automatic cleanup. */
  schedule: (callback: () => void, delayMs: number) => SafeTimeoutId;
  /** Cancel a single scheduled timer. */
  cancel: (id: SafeTimeoutId) => void;
  /** Cancel every timer scheduled through this hook. */
  cancelAll: () => void;
}

export function useSafeTimeout(): SafeTimeoutApi {
  const timersRef = useRef<Set<SafeTimeoutId>>(new Set());

  const cancel = useCallback((id: SafeTimeoutId) => {
    clearTimeout(id);
    timersRef.current.delete(id);
  }, []);

  const cancelAll = useCallback(() => {
    for (const id of timersRef.current) {
      clearTimeout(id);
    }
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number): SafeTimeoutId => {
    const id = setTimeout(() => {
      // Drop the handle before running so a callback that schedules again
      // does not leave a stale entry behind.
      timersRef.current.delete(id);
      callback();
    }, delayMs);
    timersRef.current.add(id);
    return id;
  }, []);

  useEffect(() => cancelAll, [cancelAll]);

  return { schedule, cancel, cancelAll };
}
