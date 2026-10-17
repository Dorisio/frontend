/*
 * Dorisio SDK Client
 * Singleton SDK instance for the application with token management
 */

import { DorisioClient } from 'dorisio-sdk';
import { useAuthStore } from '@/stores/auth-store';
import { ENDPOINT_TIMEOUTS } from '@/lib/request-timeout';
import { installRequestTracing } from '@/lib/request-tracing';

let instance: DorisioClient | null = null;

/**
 * Get the base URL for the API
 * Uses NEXT_PUBLIC_API_URL env var, defaults to localhost:3000
 */
function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use backend environment or default
    return process.env.API_URL || 'http://localhost:3000';
  }
  // Client-side: use public env var
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * Initialize SDK client with proper configuration
 */
export function initSDKClient(token?: string): DorisioClient {
  if (instance) {
    // Update token if provided
    if (token && instance.getConfig().token !== token) {
      instance.setToken(token);
    } else if (!token && instance.getConfig().token) {
      instance.clearToken();
    }
    return instance;
  }

  const baseUrl = getBaseUrl();
  const authToken = token || useAuthStore.getState().token || undefined;

  instance = new DorisioClient({
    baseUrl,
    token: authToken,
    timeout: ENDPOINT_TIMEOUTS.default,
  });
  installRequestTracing(instance as unknown as Parameters<typeof installRequestTracing>[0]);

  return instance;
}

/**
 * Get SDK client instance (or create if needed)
 */
export function getSDKClient(): DorisioClient {
  if (!instance) {
    return initSDKClient();
  }
  return instance;
}

/**
 * Update SDK token when authentication changes
 * Call this whenever user logs in/out
 */
export function updateSDKToken(token: string | null): void {
  const client = getSDKClient();
  if (token) {
    client.setToken(token);
  } else {
    client.clearToken();
  }
}

/**
 * Reset SDK client (useful for cleanup)
 */
export function resetSDKClient(): void {
  instance = null;
}

/**
 * React Hook: Get SDK client with automatic token sync
 * Use this in components to get the SDK client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const sdk = useSDKClient();
 *   const tips = await sdk.createTip({ creatorId: '123', amount: 100 });
 * }
 * ```
 */
export function useSDKClient(): DorisioClient {
  const token = useAuthStore((state) => state.token);

  // Initialize if needed
  if (!instance) {
    instance = initSDKClient(token ?? undefined);
  }

  // Sync token if it changed
  if (token && instance.getConfig().token !== token) {
    updateSDKToken(token);
  }

  return instance;
}

/**
 * Single centralized SDK client instance proxy.
 */
export const sdkClient: DorisioClient = new Proxy({} as DorisioClient, {
  get(_target, prop, receiver) {
    const client = getSDKClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const sdk: DorisioClient = sdkClient;
