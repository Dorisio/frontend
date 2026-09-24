import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dedupedRequest, clearDedupedRequests } from './request-deduplicator';

describe('dedupedRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearDedupedRequests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('executes the function on the first call', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    const result = await dedupedRequest(fn, 'key-1');

    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns the cached in-flight promise for a duplicate call within the window', async () => {
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('result'), 50);
        })
    );

    const call1 = dedupedRequest(fn, 'tip:creator-1:10');
    const call2 = dedupedRequest(fn, 'tip:creator-1:10');

    await vi.runAllTimersAsync();

    const [result1, result2] = await Promise.all([call1, call2]);

    expect(result1).toBe('result');
    expect(result2).toBe('result');
    // Only one real network call despite two "clicks".
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns the cached result for a duplicate call shortly after the first resolves', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    const result1 = await dedupedRequest(fn, 'key-2', { windowMs: 500 });

    // Advance a little, but stay within the 500ms window.
    await vi.advanceTimersByTimeAsync(200);

    const result2 = await dedupedRequest(fn, 'key-2', { windowMs: 500 });

    expect(result1).toBe('result');
    expect(result2).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('executes again once the dedup window has elapsed', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    await dedupedRequest(fn, 'key-3', { windowMs: 500 });

    // Move past the dedup window.
    await vi.advanceTimersByTimeAsync(600);

    await dedupedRequest(fn, 'key-3', { windowMs: 500 });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not dedupe calls with different keys', async () => {
    const fn = vi.fn().mockResolvedValue('result');

    await Promise.all([dedupedRequest(fn, 'key-a'), dedupedRequest(fn, 'key-b')]);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries transient failures through the underlying retry-backoff wrapper', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('recovered');

    const promise = dedupedRequest(fn, 'key-retry', { retries: 2 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('propagates a permanent failure to all deduped callers without extra retries', async () => {
    const error = Object.assign(new Error('validation failed'), { statusCode: 400 });
    const fn = vi.fn().mockRejectedValue(error);

    const call1 = dedupedRequest(fn, 'key-fail');
    const call2 = dedupedRequest(fn, 'key-fail');

    const [settled1, settled2] = await Promise.allSettled([call1, call2]);

    expect(settled1.status).toBe('rejected');
    expect(settled2.status).toBe('rejected');
    if (settled1.status === 'rejected') {
      expect(settled1.reason).toBeInstanceOf(Error);
      expect((settled1.reason as Error).message).toBe('validation failed');
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
