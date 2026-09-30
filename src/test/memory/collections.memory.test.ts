import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  dedupedRequest,
  clearDedupedRequests,
  getDedupedRequestCount,
} from '@/lib/request-deduplicator';

/**
 * Module-level `Map`s are a classic leak: they are never garbage collected for
 * the lifetime of the tab, so anything that grows without bound is permanent.
 * The deduplicator keeps recently-settled requests around for a window; a
 * request that never settles (or a very large key space) must not let the map
 * grow forever.
 */
describe('request deduplicator bounds its module-level map', () => {
  afterEach(() => {
    clearDedupedRequests();
    vi.useRealTimers();
  });

  it('never tracks more keys than its cap, even for never-settling requests', () => {
    vi.useFakeTimers();
    const neverSettles = () => new Promise<string>(() => {});

    for (let i = 0; i < 500; i++) {
      void dedupedRequest(neverSettles, `key-${i}`, { windowMs: 1000 });
    }

    expect(getDedupedRequestCount()).toBeLessThanOrEqual(200);
    expect(getDedupedRequestCount()).toBeGreaterThan(0);
  });

  it('clears map entries and pending cleanup timers together', async () => {
    vi.useFakeTimers();
    const resolves = () => Promise.resolve('ok');

    const calls = Array.from({ length: 10 }, (_, i) =>
      dedupedRequest(resolves, `settled-${i}`, { windowMs: 500 })
    );
    await Promise.all(calls);

    // Each settled request schedules one window cleanup timer.
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    clearDedupedRequests();

    expect(getDedupedRequestCount()).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
