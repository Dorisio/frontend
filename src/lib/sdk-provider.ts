/**
 * Centralized SDK Provider module
 *
 * Dedicated module that centralizes SDK client initialization and exports
 * a single SDK instance (`sdkClient` / `sdk`) and accessor methods for all
 * components, hooks, and providers to use throughout the application.
 */

import type { DorisioClient } from 'dorisio-sdk';
import {
  initSDKClient,
  getSDKClient,
  updateSDKToken,
  resetSDKClient,
  useSDKClient,
} from '@/lib/sdk-client';

/**
 * Single centralized SDK client instance proxy.
 * Proxies to the underlying singleton instance so method calls are always
 * forwarded to the current initialized instance, even after auth token changes
 * or test resets.
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

/**
 * Alias for the single centralized SDK client instance.
 */
export const sdk: DorisioClient = sdkClient;

export {
  initSDKClient,
  getSDKClient,
  updateSDKToken,
  resetSDKClient,
  useSDKClient,
};
