/**
 * Dorisio SDK Client
 * Singleton SDK instance for the application
 */

import { DorisioClient } from 'dorisio-sdk';
import { useAuthStore } from '@/stores/auth-store';

let sdkClient: DorisioClient | null = null;

/**
 * Initialize SDK client
 */
export function initSDKClient(): DorisioClient {
  if (sdkClient) {
    return sdkClient;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const token = useAuthStore.getState().token;

  sdkClient = new DorisioClient({
    baseUrl,
    token: token || undefined,
    timeout: 30000,
  });

  return sdkClient;
}

/**
 * Get SDK client instance
 */
export function getSDKClient(): DorisioClient {
  if (!sdkClient) {
    return initSDKClient();
  }
  return sdkClient;
}

/**
 * Update SDK token when auth changes
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
 * SDK Hooks and utilities
 */

/**
 * Hook to get SDK client
 */
export function useSDKClient(): DorisioClient {
  const token = useAuthStore((state) => state.token);

  if (!sdkClient) {
    sdkClient = initSDKClient();
  }

  // Update token if it changed
  if (token && (!sdkClient || sdkClient.getConfig().token !== token)) {
    updateSDKToken(token);
  }

  return sdkClient;
}
