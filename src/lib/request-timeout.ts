/**
 * Shared request timeout values (ms), by endpoint category.
 *
 * `default` is the SDK client's fallback timeout for any request that
 * doesn't specify its own — kept at 30s to match prior hardcoded behavior.
 */
export const ENDPOINT_TIMEOUTS = {
  default: 30000,
} as const;
