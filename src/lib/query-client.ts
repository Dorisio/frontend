/**
 * React Query Configuration
 */

import { QueryClient } from '@tanstack/react-query';

interface ErrorWithStatus extends Error {
  status?: number;
}

export const createQueryClient = (): QueryClient => {
  return new QueryClient({
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
};

// Create a singleton query client for the application
let queryClient: QueryClient | undefined;

export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
};
