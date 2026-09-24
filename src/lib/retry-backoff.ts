/**
 * Retry with exponential backoff
 *
 * Wraps an async function so transient failures (network errors, request
 * timeouts, 5xx responses) are retried automatically with an exponentially
 * increasing delay, while permanent failures (4xx validation/auth errors)
 * fail immediately since retrying them can't succeed.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts after the initial call. Default 3. */
  retries?: number;
  /** Delay before the first retry, in ms. Doubles each subsequent retry. Default 100ms. */
  baseDelayMs?: number;
  /** Upper bound on the delay between retries, in ms. Default 30000ms (30s). */
  maxDelayMs?: number;
  /**
   * Override the default transient-vs-permanent classification. Return
   * `true` if `error` is worth retrying.
   */
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 100;
const DEFAULT_MAX_DELAY_MS = 30_000;

/**
 * Best-effort extraction of an HTTP status code from an arbitrary thrown
 * value. This repo's SDK errors (see `dorisio-sdk`'s `DorisioError` and
 * subclasses such as `NetworkError`/`TimeoutError`/`RateLimitError`) expose
 * a `statusCode` field; a plain `fetch`-style error may instead carry a
 * `status` field. We check both rather than depending on the SDK's error
 * classes directly, since it's an external sibling package.
 */
function extractStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { statusCode?: unknown; status?: unknown };
  if (typeof candidate.statusCode === 'number') return candidate.statusCode;
  if (typeof candidate.status === 'number') return candidate.status;
  return undefined;
}

/**
 * Default transient-error classification, used when the caller doesn't
 * supply `isRetryable`.
 *
 * Assumption (no existing error-classification convention was found beyond
 * the ad hoc 4xx check in `src/lib/query-client.ts`'s React Query retry
 * option, which this mirrors): retry on network-level failures (no status
 * code at all, e.g. a fetch that threw before getting a response) and on
 * 5xx / 408 (request timeout) / 429 (rate limited) responses. Do not retry
 * 4xx client errors (bad input, auth, not found, etc.) since re-sending the
 * same request will fail the same way.
 */
function isTransientError(error: unknown): boolean {
  const statusCode = extractStatusCode(error);

  // No status code at all usually means the request never completed
  // (network failure, DNS error, CORS, aborted connection) - worth retrying.
  if (statusCode === undefined) return true;

  if (statusCode === 408 || statusCode === 429) return true;
  if (statusCode >= 500) return true;

  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logRetryAttempt(attempt: number, retries: number, delayMs: number, error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    const message = error instanceof Error ? error.message : String(error);
    console.log(
      `[retry-backoff] attempt ${attempt}/${retries} failed (${message}), retrying in ${delayMs}ms`
    );
  }
}

/**
 * Retry `fn` with exponential backoff on transient failures.
 *
 * Delay schedule (defaults): 100ms, 200ms, 400ms, ... capped at 30s.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const isRetryable = options?.isRetryable ?? isTransientError;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === retries;
      if (isLastAttempt || !isRetryable(error)) {
        throw error;
      }

      const delayMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      logRetryAttempt(attempt + 1, retries, delayMs, error);
      await delay(delayMs);
    }
  }

  // Unreachable: the loop above always either returns or throws.
  throw lastError;
}
