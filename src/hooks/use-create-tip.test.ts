import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateTip } from './use-create-tip';

// Mock useMutation from react-query
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((_options) => ({
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

  it('provides createTip function', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.createTip).toBe('function');
  });

  it('provides transaction functions', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.buildTransaction).toBe('function');
    expect(typeof result.current.submitTransaction).toBe('function');
    expect(typeof result.current.confirmTransaction).toBe('function');
  });

  it('provides loading state', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.loading).toBe('boolean');
  });

  it('provides error state', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(result.current.error === null || typeof result.current.error === 'string').toBe(true);
  });

  it('provides reset function', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(typeof result.current.reset).toBe('function');
  });

  it('provides tip data', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(result.current.tip === null || typeof result.current.tip === 'object').toBe(true);
  });
});
