import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthHydration } from './use-auth-hydration';

interface MockAuthState {
  hasHydrated: boolean;
  token: string | null;
}

let mockState: MockAuthState = { hasHydrated: false, token: null };

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: MockAuthState) => unknown) => selector(mockState),
}));

describe('useAuthHydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = { hasHydrated: false, token: null };
  });

  it('reports hasHydrated=false and no token before rehydration completes', () => {
    const { result } = renderHook(() => useAuthHydration());

    expect(result.current.hasHydrated).toBe(false);
    expect(result.current.token).toBeNull();
  });

  it('reports hasHydrated=true and the restored token once rehydration completes', () => {
    mockState = { hasHydrated: true, token: 'restored-token' };

    const { result } = renderHook(() => useAuthHydration());

    expect(result.current.hasHydrated).toBe(true);
    expect(result.current.token).toBe('restored-token');
  });

  it('does not call onTokenRestored while hydration is still pending', () => {
    const onTokenRestored = vi.fn();
    mockState = { hasHydrated: false, token: null };

    renderHook(() => useAuthHydration(onTokenRestored));

    expect(onTokenRestored).not.toHaveBeenCalled();
  });

  it('calls onTokenRestored with the restored token once hydration completes', () => {
    const onTokenRestored = vi.fn();
    mockState = { hasHydrated: true, token: 'my-token' };

    renderHook(() => useAuthHydration(onTokenRestored));

    expect(onTokenRestored).toHaveBeenCalledWith('my-token');
  });

  it('calls onTokenRestored with null when hydration completes with no persisted session', () => {
    const onTokenRestored = vi.fn();
    mockState = { hasHydrated: true, token: null };

    renderHook(() => useAuthHydration(onTokenRestored));

    expect(onTokenRestored).toHaveBeenCalledWith(null);
  });

  it('works without an onTokenRestored callback', () => {
    mockState = { hasHydrated: true, token: 'some-token' };

    expect(() => renderHook(() => useAuthHydration())).not.toThrow();
  });
});
