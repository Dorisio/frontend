import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTransactionHistory } from './use-transaction-history';

// Mock useQuery from react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options) => {
    if (options.enabled !== false) {
      return {
        data: {
          transactions: [
            {
              id: 'tx-1',
              amount: 50,
              createdAt: new Date('2024-01-15'),
              status: 'confirmed',
              message: 'Great content!',
            },
            {
              id: 'tx-2',
              amount: 100,
              createdAt: new Date('2024-01-16'),
              status: 'confirmed',
              message: null,
            },
          ],
          total: 2,
          page: 1,
          pageSize: 10,
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    };
  }),
}));

// Mock the Dorisio SDK
vi.mock('dorisio-sdk/react', () => ({
  useDorisio: vi.fn(() => ({
    client: {
      getTransactionHistory: vi.fn(),
    },
  })),
}));

describe('useTransactionHistory Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns transaction data when creator ID is provided', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(result.current.transactions).toBeDefined();
    expect(Array.isArray(result.current.transactions)).toBe(true);
    expect(result.current.transactions.length).toBeGreaterThan(0);
  });

  it('returns empty array when creator ID is not provided', () => {
    const { result } = renderHook(() => useTransactionHistory(undefined));

    expect(Array.isArray(result.current.transactions)).toBe(true);
  });

  it('provides pagination info', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(result.current.page).toBeDefined();
    expect(result.current.pageSize).toBeDefined();
    expect(result.current.total).toBeDefined();
  });

  it('provides pagination functions', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(typeof result.current.nextPage).toBe('function');
    expect(typeof result.current.prevPage).toBe('function');
  });

  it('provides loading state', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('provides error state', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
  });

  it('provides refetch function', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(typeof result.current.refetch).toBe('function');
  });

  it('handles transaction with no message', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    const txWithoutMessage = result.current.transactions.find((tx) => !tx.message);
    expect(txWithoutMessage).toBeDefined();
    expect(txWithoutMessage?.message).toBeNull();
  });

  it('handles transaction status variants', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    const statuses = result.current.transactions.map((tx) => tx.status);
    expect(statuses.every((status) => ['confirmed', 'pending', 'failed'].includes(status))).toBe(
      true
    );
  });

  it('returns transactions in descending date order', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    if (result.current.transactions.length > 1) {
      for (let i = 0; i < result.current.transactions.length - 1; i++) {
        const current = new Date(result.current.transactions[i].createdAt).getTime();
        const next = new Date(result.current.transactions[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });

  it('handles pagination correctly', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBeGreaterThan(0);
  });

  it('provides accurate total count', () => {
    const { result } = renderHook(() => useTransactionHistory('creator-123'));

    expect(result.current.total).toBeGreaterThanOrEqual(result.current.transactions.length);
  });
});
