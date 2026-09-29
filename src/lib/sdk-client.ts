/**
 * Dorisio SDK Client
 * Singleton SDK instance for the application with token management
 */

import { DorisioClient } from 'dorisio-sdk';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Contract testing support for third-party API integrations.
 *
 * These helpers expose the client-server expectations (contracts) that the
 * SDK relies on so they can be validated in CI with Pact. The contracts are
 * intentionally declarative and framework-agnostic; the test harness consumes
 * them to generate provider/consumer contract tests.
 */
export interface ApiContract {
  /** Human readable description of the interaction. */
  description: string;
  /** HTTP method used by the SDK. */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Path template (may include :params). */
  path: string;
  /** Expected request body shape (optional). */
  requestBody?: Record<string, unknown>;
  /** Expected response status. */
  status: number;
  /** Expected response body shape. */
  responseBody?: Record<string, unknown>;
}

/**
 * Canonical API contracts for the third-party integrations used by the SDK.
 * Update these whenever the SDK's expectations of the API change so that
 * contract violations are caught in CI before they reach production.
 */
export const API_CONTRACTS: ApiContract[] = [
  {
    description: 'create a tip',
    method: 'POST',
    path: '/tips',
    requestBody: { creatorId: 'string', amount: 'number' },
    status: 201,
    responseBody: { id: 'string', creatorId: 'string', amount: 'number' },
  },
  {
    description: 'get current user',
    method: 'GET',
    path: '/me',
    status: 200,
    responseBody: { id: 'string', email: 'string' },
  },
];

/**
 * Return the API contracts for contract testing.
 */
export function getApiContracts(): ApiContract[] {
  return API_CONTRACTS;
}

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
    sdkClient = initSDKClient(token ?? undefined);
  }

  // Sync token if it changed
  if (token && sdkClient.getConfig().token !== token) {
    updateSDKToken(token);
  }

  return sdkClient;
}
