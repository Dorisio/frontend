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

/**
 * Upper bound on tracked keys. Entries normally evict themselves a `windowMs`
 * after they settle, but a request that never settles (a hung/aborted fetch)
 * would otherwise live in the map forever. Evicting the oldest entry keeps the
 * map bounded; the worst case is that a duplicate for an evicted key executes
 * again, which is the same behaviour as the dedup window simply expiring.
 */
const MAX_PENDING_ENTRIES = 200;

interface PendingEntry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

// Module-level so dedup works across independent callers/components that
// use the same key, not just repeated calls from a single hook instance.
const pending = new Map<string, PendingEntry<unknown>>();

// Cleanup timers, tracked so `clearDedupedRequests()` (used by tests) can
// cancel them instead of leaving stray timers behind.
const cleanupTimers = new Set<ReturnType<typeof setTimeout>>();

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

  // Bound the map: Map iteration is insertion-ordered, so the first key is
  // the oldest. Skip the key we just inserted so a burst of distinct keys can
  // still dedup the current call.
  if (pending.size > MAX_PENDING_ENTRIES) {
    for (const oldestKey of pending.keys()) {
      if (oldestKey !== key) {
        pending.delete(oldestKey);
        break;
      }
    }
  }

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
      const timer = setTimeout(() => {
        cleanupTimers.delete(timer);
        const current = pending.get(key);
        if (current && current.promise === promise) {
          pending.delete(key);
        }
      }, windowMs);
      cleanupTimers.add(timer);
    })
    .catch(() => {});

  return promise;
}

/** Clears all tracked in-flight/recent requests and pending cleanup timers. */
export function clearDedupedRequests(): void {
  pending.clear();
  for (const timer of cleanupTimers) {
    clearTimeout(timer);
  }
  cleanupTimers.clear();
}

/** Exposed for tests: current number of tracked keys. */
export function getDedupedRequestCount(): number {
  return pending.size;
}
