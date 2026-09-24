/**
 * Request deduplication
 *
 * Prevents duplicate in-flight (or just-completed) requests that share the
 * same fingerprint - e.g. a user double-clicking "Send Tip" firing the same
 * mutation twice before the first request has resolved. Callers within the
 * dedup window get the original call's promise instead of triggering a new
 * network request.
 *
 * Execution goes through `retryWithBackoff` so deduped requests also get
 * transient-failure retry for free.
 */

import { retryWithBackoff, type RetryOptions } from './retry-backoff';

const DEFAULT_WINDOW_MS = 500;

interface PendingEntry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

// Module-level so dedup works across independent callers/components that
// use the same key, not just repeated calls from a single hook instance.
const pending = new Map<string, PendingEntry<unknown>>();

export interface DedupedRequestOptions extends RetryOptions {
  /** How long a completed call's result stays eligible for reuse, in ms. Default 500ms. */
  windowMs?: number;
}

/**
 * Run `fn` (via `retryWithBackoff`) unless an equivalent call for the same
 * `key` is already in flight or completed within the dedup window, in which
 * case the existing call's promise is returned instead of executing `fn`
 * again.
 *
 * @param fn The request to execute.
 * @param key Fingerprint identifying "the same request" - callers should
 *   derive this from the method + params, e.g. `tip:${creatorId}:${amount}`.
 * @param options Retry options plus an optional `windowMs` dedup window.
 */
export function dedupedRequest<T>(
  fn: () => Promise<T>,
  key: string,
  options?: DedupedRequestOptions
): Promise<T> {
  const existing = pending.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.promise as Promise<T>;
  }

  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const promise = retryWithBackoff(fn, options);

  pending.set(key, {
    promise,
    // Kept alive for `windowMs` after being registered so a duplicate call
    // arriving while the request is still in flight is deduped too (not
    // just ones arriving after it resolves).
    expiresAt: Date.now() + windowMs,
  });

  // Once settled, drop the entry after the window elapses (rather than
  // immediately) so a duplicate click that lands just after resolution
  // still reuses the result instead of firing a fresh request.
  //
  // `.finally()` re-throws on rejection, and its returned promise is never
  // otherwise observed - swallow that here (the original `promise` returned
  // to callers still rejects normally) so a failed request doesn't surface
  // as an unhandled rejection.
  promise
    .finally(() => {
      setTimeout(() => {
        const current = pending.get(key);
        if (current && current.promise === promise) {
          pending.delete(key);
        }
      }, windowMs);
    })
    .catch(() => {});

  return promise;
}

/** Clears all tracked in-flight/recent requests. Intended for tests. */
export function clearDedupedRequests(): void {
  pending.clear();
}
