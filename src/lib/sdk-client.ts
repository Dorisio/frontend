/**
 * Dorisio SDK Client
 * Singleton SDK instance for the application with token management
 */

import { DorisioClient } from 'dorisio-sdk';
import { useAuthStore } from '@/stores/auth-store';

let sdkClient: DorisioClient | null = null;

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
  if (sdkClient) {
    // Update token if provided
    if (token && sdkClient.getConfig().token !== token) {
      sdkClient.setToken(token);
    } else if (!token && sdkClient.getConfig().token) {
      sdkClient.clearToken();
    }
    return sdkClient;
  }

  const baseUrl = getBaseUrl();
  const authToken = token || useAuthStore.getState().token || undefined;

  sdkClient = new DorisioClient({
    baseUrl,
    token: authToken,
    timeout: 30000,
  });

  return sdkClient;
}

/**
 * Get SDK client instance (or create if needed)
 */
export function getSDKClient(): DorisioClient {
  if (!sdkClient) {
    return initSDKClient();
  }
  return sdkClient;
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
  sdkClient = null;
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
  if (!sdkClient) {
    sdkClient = initSDKClient(token);
  }

  // Sync token if it changed
  if (token && sdkClient.getConfig().token !== token) {
    updateSDKToken(token);
  }

  return sdkClient;
}
