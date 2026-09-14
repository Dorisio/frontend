import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreatorBalance } from './use-creator-balance';

// Mock useQuery from react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options) => {
    // Simulate successful query
    if (options.enabled !== false) {
      return {
        data: {
          totalEarnings: 1000,
          availableBalance: 500,
          pendingBalance: 500,
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
      getCreatorBalance: vi.fn(),
    },
  })),
}));

describe('useCreatorBalance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns balance data when creator ID is provided', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(result.current.balance).toBeDefined();
    expect(result.current.balance?.totalEarnings).toBe(1000);
    expect(result.current.balance?.availableBalance).toBe(500);
    expect(result.current.balance?.pendingBalance).toBe(500);
  });

  it('returns null balance when creator ID is not provided', () => {
    const { result } = renderHook(() => useCreatorBalance(undefined));

    expect(result.current.balance).toBeNull();
  });

  it('provides loading state', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('provides error state', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });

  it('provides refetch function', () => {
    const { result } = renderHook(() => useCreatorBalance('creator-123'));

    expect(typeof result.current.refetch).toBe('function');
  });
});
