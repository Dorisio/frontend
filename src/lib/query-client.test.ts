import { describe, expect, it } from 'vitest';
import { createQueryClient, isRetryableError } from './query-client';

describe('query client cache policy', () => {
  it('uses longer cache windows for analytics and creator data', () => {
    const client = createQueryClient();
    expect(client.getQueryDefaults(['creatorAnalytics'])?.staleTime).toBe(5 * 60 * 1000);
    expect(client.getQueryDefaults(['transactionHistory'])?.staleTime).toBe(2 * 60 * 1000);
    expect(client.getQueryDefaults(['creators'])?.staleTime).toBe(10 * 60 * 1000);
  });
});

/**
 * Retry behavior (backoff, jitter, error classification) is delegated to
 * `@/lib/retry-backoff` rather than implemented inside React Query's own
 * `retry`/`retryDelay` options - see query-client.ts's module doc comment.
 * React Query's own retry is deliberately disabled (`retry: 0`,
 * `retryDelay: 0`) so a caller using `retryWithBackoff` doesn't get
 * double-retried. retry-backoff.test.ts covers the actual backoff/jitter
 * schedule and error classification directly.
 */
describe('query client retry policy', () => {
  it('disables React Query\'s own retry for queries and mutations', () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();
    expect(defaults.queries?.retry).toBe(0);
    expect(defaults.queries?.retryDelay).toBe(0);
    expect(defaults.mutations?.retry).toBe(0);
    expect(defaults.mutations?.retryDelay).toBe(0);
  });

  it('re-exports the shared retry-backoff error classifier for consumers', () => {
    const serverError = Object.assign(new Error('Server Error'), { status: 500 });
    const badRequest = Object.assign(new Error('Bad Request'), { status: 400 });
    expect(isRetryableError(serverError)).toBe(true);
    expect(isRetryableError(badRequest)).toBe(false);
  });
});
