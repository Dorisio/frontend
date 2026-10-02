/*
 * React Query Configuration

 * Retry behavior is delegated to the shared retry layer (`@/lib/retry-backoff`)
 * so timeouts, exponential backoff, and jitter are applied consistently across
 * the app. React Query's own retry count is set to 0 to avoid double-retrying.
 */

import { QueryClient } from '@tanstack/react-query';
import { isTransientError as isRetryableError } from '@/lib/retry-backoff';

export const createQueryClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time)
        // The retry layer handles retries with backoff, jitter, and
        // timeouts. React Query should not retry again on top.
        retry: 0,
        retryDelay: 0,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
        retryDelay: 0,
      },
    },
  });

  // Data lifetimes reflect how quickly each dashboard surface changes. The
  // query keys are shared by all consumers, so duplicate mounts reuse the
  // same in-flight promise and cached result.
  client.setQueryDefaults(['creatorAnalytics'], {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  client.setQueryDefaults(['transactionHistory'], {
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  client.setQueryDefaults(['creatorBalance'], {
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  client.setQueryDefaults(['creators'], {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return client;
};

// Create a singleton query client for the application
let queryClient: QueryClient | undefined;

export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};

/** Exposed for consumers that need to classify errors for their own retry logic. */
export { isRetryableError };
