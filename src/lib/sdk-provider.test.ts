import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DorisioClient } from 'dorisio-sdk';
import {
  sdk,
  sdkClient,
  getSDKClient,
  initSDKClient,
  updateSDKToken,
  resetSDKClient,
  useSDKClient,
} from '@/lib/sdk-provider';

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

    getHttpClient(): { getInterceptors: () => { addRequestInterceptor: () => void } } {
      return { getInterceptors: () => ({ addRequestInterceptor: vi.fn() }) };
    }
  }
  return { DorisioClient: vi.fn(MockDorisioClient) };
});

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: () => ({ token: null }),
  },
}));

describe('sdk-provider', () => {
  beforeEach(() => {
    resetSDKClient();
  });

  it('exports a single SDK client instance (sdk and sdkClient)', () => {
    expect(sdk).toBeDefined();
    expect(sdkClient).toBeDefined();
  });

  it('proxies method calls to the single initialized instance', () => {
    const config = sdk.getConfig();
    expect(config).toBeDefined();
    expect(config.baseUrl).toContain('http');
  });

  it('shares the same underlying instance between getSDKClient and sdk export', () => {
    const client = getSDKClient();
    client.setToken('test-token-123');
    expect(sdk.getConfig().token).toBe('test-token-123');
    expect(sdkClient.getConfig().token).toBe('test-token-123');
  });

  it('updates token across singletons when updateSDKToken is called', () => {
    updateSDKToken('jwt-token-xyz');
    expect(sdk.getConfig().token).toBe('jwt-token-xyz');

    updateSDKToken(null);
    expect(sdk.getConfig().token).toBeUndefined();
  });

  it('exports useSDKClient hook and initSDKClient helper', () => {
    expect(typeof useSDKClient).toBe('function');
    expect(typeof initSDKClient).toBe('function');
  });
});
