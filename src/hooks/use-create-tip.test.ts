import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCreateTip } from './use-create-tip';

// Mock useMutation from react-query
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((options) => ({
    mutate: vi.fn(async (data) => {
      return {
        id: 'tip-123',
        amount: data.amount,
        creatorId: data.creatorId,
        status: 'success',
      };
    }),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
    reset: vi.fn(),
  })),
}));

// Mock the Dorisio SDK
vi.mock('dorisio-sdk/react', () => ({
  useDorisio: vi.fn(() => ({
    client: {
      createTip: vi.fn(),
    },
  })),
}));

describe('useCreateTip Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides mutate function', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.mutate).toBe('function');
  });

  it('provides mutation states', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.isPending).toBe('boolean');
    expect(typeof result.current.isSuccess).toBe('boolean');
    expect(typeof result.current.isError).toBe('boolean');
  });

  it('provides error state', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(result.current.error === null || result.current.error instanceof Error).toBe(true);
  });

  it('provides reset function', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.reset).toBe('function');
  });

  it('handles mutation data', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(result.current.data === null || typeof result.current.data === 'object').toBe(true);
  });
});
