import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retryWithBackoff } from './retry-backoff';

class HttpError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result immediately on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await retryWithBackoff(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a transient (network) error and succeeds within the configured attempts', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('recovered');

    const promise = retryWithBackoff(fn, { retries: 3 });
    // Let both retry delays elapse.
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries a 5xx error', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new HttpError('server error', 503)).mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry a permanent 4xx error', async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError('bad request', 400));

    const promise = retryWithBackoff(fn, { retries: 3 });
    // Attach a rejection handler synchronously to avoid an unhandled
    // rejection warning while we assert below.
    const assertion = expect(promise).rejects.toThrow('bad request');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws the last error once retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('still failing'));

    const promise = retryWithBackoff(fn, { retries: 2 });
    const assertion = expect(promise).rejects.toThrow('still failing');
    await vi.runAllTimersAsync();
    await assertion;

    // Initial attempt + 2 retries = 3 calls.
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('follows the exponential backoff schedule: 100ms, 200ms, 400ms', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const promise = retryWithBackoff(fn, { retries: 3 });
    const assertion = expect(promise).rejects.toThrow();
    await vi.runAllTimersAsync();
    await assertion;

    const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
    expect(delays).toEqual([100, 200, 400]);
  });

  it('caps the delay at maxDelayMs', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('network error'));
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    const promise = retryWithBackoff(fn, { retries: 4, baseDelayMs: 1000, maxDelayMs: 3000 });
    const assertion = expect(promise).rejects.toThrow();
    await vi.runAllTimersAsync();
    await assertion;

    // 1000, 2000, 4000->capped 3000, 8000->capped 3000
    const delays = setTimeoutSpy.mock.calls.map((call) => call[1]);
    expect(delays).toEqual([1000, 2000, 3000, 3000]);
  });

  it('respects a custom isRetryable classifier', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('custom-error'));
    const isRetryable = vi.fn().mockReturnValue(false);

    const promise = retryWithBackoff(fn, { retries: 3, isRetryable });
    await expect(promise).rejects.toThrow('custom-error');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(isRetryable).toHaveBeenCalledWith(expect.any(Error));
  });

  it('treats an error with no status code as transient (network-level failure)', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fetch failed')).mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry a 401/403 auth error', async () => {
    const fn = vi.fn().mockRejectedValue(new HttpError('unauthorized', 401));

    const promise = retryWithBackoff(fn);
    await expect(promise).rejects.toThrow('unauthorized');

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
