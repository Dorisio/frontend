import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCreateTip } from './use-create-tip';
import type { SDKTipResult, UseCreateTipReturn } from 'dorisio-sdk/react';

const { mockSdkUseCreateTip, mockSdkCreateTip } = vi.hoisted(() => ({
  mockSdkUseCreateTip: vi.fn(),
  mockSdkCreateTip: vi.fn(),
}));

vi.mock('dorisio-sdk/react', () => ({
  useCreateTip: mockSdkUseCreateTip,
}));

const defaultResult: SDKTipResult = {
  id: 'tip-123',
  amount: 25,
  status: 'success',
  transactionHash: 'tx-hash-123',
};

function sdkReturn(overrides: Partial<UseCreateTipReturn> = {}): UseCreateTipReturn {
  return {
    createTip: mockSdkCreateTip,
    buildTransaction: vi.fn(async () => undefined),
    submitTransaction: vi.fn(async () => undefined),
    confirmTransaction: vi.fn(async () => undefined),
    data: null,
    loading: false,
    error: null,
    step: null,
    reset: vi.fn(),
    ...overrides,
  };
}

describe('useCreateTip Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdkCreateTip.mockResolvedValue(defaultResult);
    mockSdkUseCreateTip.mockReturnValue(sdkReturn());
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

  it('maps the SDK result into a TipResponse when creating a tip', async () => {
    const { result } = renderHook(() => useCreateTip());

    const response = await result.current.createTip({
      creatorId: 'creator-1',
      amount: 25,
      message: 'Great work',
    });

    expect(mockSdkCreateTip).toHaveBeenCalledWith({
      creatorId: 'creator-1',
      amount: 25,
      message: 'Great work',
    });
    expect(response).toEqual({
      id: 'tip-123',
      amount: 25,
      status: 'success',
      transactionHash: 'tx-hash-123',
    });
  });

  it('falls back to the SDK step when the result has no status', async () => {
    mockSdkCreateTip.mockResolvedValue({ id: 'tip-1', amount: 10 });
    mockSdkUseCreateTip.mockReturnValue(sdkReturn({ step: 'submitting' }));

    const { result } = renderHook(() => useCreateTip());

    const response = await result.current.createTip({ creatorId: 'c', amount: 10 });

    expect(response.status).toBe('submitting');
  });

  it('defaults to pending when neither result nor step provides a status', async () => {
    mockSdkCreateTip.mockResolvedValue({});

    const { result } = renderHook(() => useCreateTip());

    const response = await result.current.createTip({ creatorId: 'c', amount: 10 });

    expect(response.status).toBe('pending');
    expect(response.transactionHash).toBeUndefined();
  });

  it('exposes tip data mapped from the SDK', () => {
    mockSdkUseCreateTip.mockReturnValue(
      sdkReturn({
        data: { id: 'tip-9', amount: 50, status: 'confirmed', transactionHash: 'tx-9' },
        step: 'submitting',
      })
    );

    const { result } = renderHook(() => useCreateTip());

    expect(result.current.tip).toEqual({
      id: 'tip-9',
      amount: 50,
      status: 'confirmed',
      transactionHash: 'tx-9',
    });
  });

  it('returns null tip when SDK data is null', () => {
    const { result } = renderHook(() => useCreateTip());

    expect(result.current.tip).toBeNull();
  });
});