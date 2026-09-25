/**
 * Tests for the Dorisio SDK client singleton and token management.
 *
 * The `dorisio-sdk` package is a sibling `file:../sdk` dependency that may not
 * be resolvable in every environment, and the auth store wires back into this
 * module (`updateSDKToken` on rehydration), so both are mocked here.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DorisioClient } from 'dorisio-sdk';
import {
  initSDKClient,
  getSDKClient,
  updateSDKToken,
  resetSDKClient,
  useSDKClient,
} from '@/lib/sdk-client';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('dorisio-sdk', () => {
  class MockDorisioClient {
    config: { baseUrl: string; timeout: number; token?: string };

    constructor(config: { baseUrl: string; timeout?: number; token?: string }) {
      this.config = { timeout: config.timeout ?? 30000, ...config };
    }

    getConfig(): { baseUrl: string; timeout: number; token?: string } {
      return { ...this.config };
    }

    setToken(token: string): void {
      this.config.token = token;
    }

    clearToken(): void {
      this.config.token = undefined;
    }
  }
  return { DorisioClient: vi.fn(MockDorisioClient) };
});

interface MockAuthUser {
  id: string;
  email: string;
  role: 'fan' | 'creator' | 'admin';
}

interface MockAuthStore {
  user: MockAuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: MockAuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
  login: (user: MockAuthUser, token: string) => void;
}

vi.mock('@/stores/auth-store', async () => {
  const { create } = await import('zustand');
  const useAuthStore = create<MockAuthStore>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: false,
    setUser: (user): void => set({ user, isAuthenticated: !!user }),
    setToken: (token): void => set({ token }),
    setLoading: (loading): void => set({ isLoading: loading }),
    setHasHydrated: (hasHydrated): void => set({ hasHydrated }),
    login: (user, token): void =>
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }),
    logout: (): void =>
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }),
  }));
  return { useAuthStore };
});

const DorisioClientMock = vi.mocked(DorisioClient);

function lastInstance(): DorisioClient {
  return DorisioClientMock.mock.instances[DorisioClientMock.mock.instances.length - 1];
}

function resetAuthStore(): void {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: false,
  });
}

describe('sdk-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSDKClient();
    resetAuthStore();
    delete process.env.API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    resetSDKClient();
  });

  describe('initSDKClient', () => {
    it('creates a client with the default base URL and no token', () => {
      initSDKClient();

      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
      expect(DorisioClientMock).toHaveBeenCalledWith({
        baseUrl: 'http://localhost:3000',
        token: undefined,
        timeout: 30000,
      });
      expect(lastInstance().getConfig().token).toBeUndefined();
    });

    it('uses NEXT_PUBLIC_API_URL for the base URL on the client side', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.dorisio.example';

      initSDKClient();

      expect(lastInstance().getConfig().baseUrl).toBe('https://api.dorisio.example');
    });

    it('creates a client with an explicit token', () => {
      initSDKClient('bearer-token');

      expect(DorisioClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'bearer-token' })
      );
      expect(lastInstance().getConfig().token).toBe('bearer-token');
    });

    it('falls back to the auth store token when none is passed', () => {
      useAuthStore.setState({ token: 'store-token' });

      initSDKClient();

      expect(DorisioClientMock).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'store-token' })
      );
      expect(lastInstance().getConfig().token).toBe('store-token');
    });

    it('returns the existing instance instead of creating a new one', () => {
      const first = initSDKClient();
      const second = initSDKClient();

      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });

    it('updates the token on an existing client when a new token is passed', () => {
      initSDKClient('token-a');
      const instance = lastInstance();
      const setTokenSpy = vi.spyOn(instance, 'setToken');

      initSDKClient('token-b');

      expect(setTokenSpy).toHaveBeenCalledWith('token-b');
      expect(instance.getConfig().token).toBe('token-b');
    });

    it('clears the token on an existing client when no token is passed', () => {
      initSDKClient('token-a');
      const instance = lastInstance();
      const clearTokenSpy = vi.spyOn(instance, 'clearToken');

      initSDKClient();

      expect(clearTokenSpy).toHaveBeenCalledTimes(1);
      expect(instance.getConfig().token).toBeUndefined();
    });

    it('does not touch the token when the existing value is unchanged', () => {
      initSDKClient('token-a');
      const instance = lastInstance();
      const setTokenSpy = vi.spyOn(instance, 'setToken');
      const clearTokenSpy = vi.spyOn(instance, 'clearToken');

      initSDKClient('token-a');

      expect(setTokenSpy).not.toHaveBeenCalled();
      expect(clearTokenSpy).not.toHaveBeenCalled();
    });

    it('uses API_URL for the base URL on the server side', () => {
      vi.stubGlobal('window', undefined);
      process.env.API_URL = 'http://backend.internal:8080';

      initSDKClient();

      expect(lastInstance().getConfig().baseUrl).toBe('http://backend.internal:8080');
    });

    it('falls back to localhost on the server side when API_URL is unset', () => {
      vi.stubGlobal('window', undefined);

      initSDKClient();

      expect(lastInstance().getConfig().baseUrl).toBe('http://localhost:3000');
    });

    it('propagates errors thrown while constructing the client', () => {
      DorisioClientMock.mockImplementationOnce(() => {
        throw new Error('sdk construct failed');
      });

      expect(() => initSDKClient()).toThrow('sdk construct failed');
    });
  });

  describe('getSDKClient', () => {
    it('lazily creates an instance when none exists', () => {
      const client = getSDKClient();

      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
      expect(client.getConfig().baseUrl).toBe('http://localhost:3000');
    });

    it('returns the same instance across repeated calls (singleton)', () => {
      initSDKClient();
      const first = getSDKClient();
      const second = getSDKClient();

      expect(first).toBe(second);
      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
    });

    it('propagates errors when lazy initialization fails', () => {
      DorisioClientMock.mockImplementationOnce(() => {
        throw new Error('lazy init failed');
      });

      expect(() => getSDKClient()).toThrow('lazy init failed');
    });
  });

  describe('updateSDKToken', () => {
    it('sets the token on the client when a token is provided', () => {
      initSDKClient();
      const instance = lastInstance();
      const setTokenSpy = vi.spyOn(instance, 'setToken');

      updateSDKToken('fresh-token');

      expect(setTokenSpy).toHaveBeenCalledWith('fresh-token');
      expect(instance.getConfig().token).toBe('fresh-token');
    });

    it('clears the token on the client when null is provided', () => {
      initSDKClient('token-a');
      const instance = lastInstance();
      const clearTokenSpy = vi.spyOn(instance, 'clearToken');

      updateSDKToken(null);

      expect(clearTokenSpy).toHaveBeenCalledTimes(1);
      expect(instance.getConfig().token).toBeUndefined();
    });
  });

  describe('resetSDKClient', () => {
    it('forces the next client access to create a fresh instance', () => {
      const original = initSDKClient();

      resetSDKClient();

      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
      const replacement = getSDKClient();
      expect(replacement).not.toBe(original);
      expect(DorisioClientMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('useSDKClient', () => {
    it('creates a client on first render using the default base URL', () => {
      const { result } = renderHook(() => useSDKClient());

      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
      expect(result.current.getConfig().baseUrl).toBe('http://localhost:3000');
      expect(result.current.getConfig().token).toBeUndefined();
    });

    it('initializes with the token already present in the auth store', () => {
      useAuthStore.setState({ token: 'hydrated-token' });

      const { result } = renderHook(() => useSDKClient());

      expect(result.current.getConfig().token).toBe('hydrated-token');
    });

    it('syncs a newly set store token to the existing client', () => {
      const { result, rerender } = renderHook(() => useSDKClient());
      const instance = lastInstance();
      const setTokenSpy = vi.spyOn(instance, 'setToken');

      act(() => {
        useAuthStore.setState({ token: 'store-token' });
      });
      rerender();

      expect(setTokenSpy).toHaveBeenCalledWith('store-token');
      expect(result.current.getConfig().token).toBe('store-token');
    });

    it('does not reset the shared client when the store token is unchanged', () => {
      useAuthStore.setState({ token: 'same-token' });
      const { rerender } = renderHook(() => useSDKClient());
      const instance = lastInstance();
      const setTokenSpy = vi.spyOn(instance, 'setToken');

      act(() => {
        useAuthStore.setState({ token: 'same-token' });
      });
      rerender();

      expect(setTokenSpy).not.toHaveBeenCalled();
      expect(instance.getConfig().token).toBe('same-token');
    });

    it('returns the same shared instance across re-renders', () => {
      const { result, rerender } = renderHook(() => useSDKClient());
      const first = result.current;

      rerender();

      expect(result.current).toBe(first);
      expect(DorisioClientMock).toHaveBeenCalledTimes(1);
    });
  });
});