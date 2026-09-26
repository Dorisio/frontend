/**
 * React Query Configuration
 */

import { QueryClient } from '@tanstack/react-query';

interface ErrorWithStatus extends Error {
  status?: number;
}

export const createQueryClient = (): QueryClient => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (garbage collection time)
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors (except 408)
          if (error instanceof Error) {
            const status = (error as ErrorWithStatus).status;
            if (status && status >= 400 && status < 500 && status !== 408) {
              return false;
            }
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
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
