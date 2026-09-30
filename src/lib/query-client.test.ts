import { describe, expect, it } from 'vitest';
import { createQueryClient } from './query-client';

describe('query client cache policy', () => {
  it('uses longer cache windows for analytics and creator data', () => {
    const client = createQueryClient();
    expect(client.getQueryDefaults(['creatorAnalytics'])?.staleTime).toBe(5 * 60 * 1000);
    expect(client.getQueryDefaults(['transactionHistory'])?.staleTime).toBe(2 * 60 * 1000);
    expect(client.getQueryDefaults(['creators'])?.staleTime).toBe(10 * 60 * 1000);
  });
});

describe('query client retry policy', () => {
  it('enforces a bounded retry limit', () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');
    const retryFn = retry as (failureCount: number, error: unknown) => boolean;
    expect(retryFn(0, new Error('network'))).toBe(true);
    expect(retryFn(1, new Error('network'))).toBe(true);
    expect(retryFn(2, new Error('network'))).toBe(true);
    expect(retryFn(3, new Error('network'))).toBe(false);
    expect(retryFn(10, new Error('network'))).toBe(false);
  });

  it('does not retry non-retryable client errors', () => {
    const client = createQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean;
    const badRequest = Object.assign(new Error('Bad Request'), { status: 400 });
    const unauthorized = Object.assign(new Error('Unauthorized'), { status: 401 });
    const notFound = Object.assign(new Error('Not Found'), { status: 404 });
    expect(retryFn(0, badRequest)).toBe(false);
    expect(retryFn(0, unauthorized)).toBe(false);
    expect(retryFn(0, notFound)).toBe(false);
  });

  it('retries server and network errors', () => {
    const client = createQueryClient();
    const retryFn = client.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean;
    const serverError = Object.assign(new Error('Server Error'), { status: 500 });
    const gatewayTimeout = Object.assign(new Error('Gateway Timeout'), { status: 504 });
    const rateLimited = Object.assign(new Error('Too Many Requests'), { status: 429 });
    expect(retryFn(0, serverError)).toBe(true);
    expect(retryFn(0, gatewayTimeout)).toBe(true);
    expect(retryFn(0, rateLimited)).toBe(true);
  });

  it('applies exponential backoff with jitter', () => {
    const client = createQueryClient();
    const delay = client.getDefaultOptions().queries?.retryDelay as (
      attemptIndex: number,
    ) => number;
    expect(typeof delay).toBe('function');

    const samples = Array.from({ length: 50 }, () => delay(0));
    const min0 = Math.min(...samples);
    const max0 = Math.max(...samples);
    expect(min0).toBeGreaterThanOrEqual(0);
    expect(max0).toBeLessThanOrEqual(1000);
    expect(max0).toBeGreaterThan(min0);

    const samples1 = Array.from({ length: 50 }, () => delay(1));
    const min1 = Math.min(...samples1);
    const max1 = Math.max(...samples1);
    expect(min1).toBeGreaterThanOrEqual(0);
    expect(max1).toBeLessThanOrEqual(2000);

    const samples2 = Array.from({ length: 50 }, () => delay(2));
    const max2 = Math.max(...samples2);
    expect(max2).toBeLessThanOrEqual(4000);
  });

  it('caps retry delay at a maximum', () => {
    const client = createQueryClient();
    const delay = client.getDefaultOptions().queries?.retryDelay as (
      attemptIndex: number,
    ) => number;
    const capped = delay(20);
    expect(capped).toBeLessThanOrEqual(30_000);
    expect(capped).toBeGreaterThanOrEqual(0);
  });

  it('produces jittered delays that are not all identical', () => {
    const client = createQueryClient();
    const delay = client.getDefaultOptions().queries?.retryDelay as (
      attemptIndex: number,
    ) => number;
    const samples = Array.from({ length: 25 }, () => delay(3));
    const unique = new Set(samples);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('query client timeout policy', () => {
  it('configures a request timeout for queries', () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions().queries as Record<string, unknown>;
    const timeout =
      (options?.networkTimeout as number | undefined) ??
      (options?.requestTimeout as number | undefined) ??
      (options?.timeout as number | undefined);
    expect(typeof timeout).toBe('number');
    expect(timeout).toBeGreaterThan(0);
  });

  it('configures a request timeout for mutations', () => {
    const client = createQueryClient();
    const options = client.getDefaultOptions().mutations as Record<string, unknown>;
    const timeout =
      (options?.networkTimeout as number | undefined) ??
      (options?.requestTimeout as number | undefined) ??
      (options?.timeout as number | undefined);
    expect(typeof timeout).toBe('number');
    expect(timeout).toBeGreaterThan(0);
  });
});

describe('query client retry metrics', () => {
  it('exposes retry metrics tracking', () => {
    const client = createQueryClient();
    const metrics = (client as unknown as { retryMetrics?: unknown }).retryMetrics;
    expect(metrics).toBeDefined();
  });
});
