'use client';

import { ReactNode, useCallback, useMemo, type ComponentType } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DorisioClient, type ClientConfig } from 'dorisio-sdk';
import { DorisioProvider } from 'dorisio-sdk/react';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { getQueryClient } from '@/lib/query-client';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

const CompatibleDorisioProvider = DorisioProvider as unknown as ComponentType<{
  client: DorisioClient;
  config: ClientConfig;
  children: ReactNode;
}>;

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const queryClient = getQueryClient();

  // Initialize Dorisio client
  const dorisioClient = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return new DorisioClient({
      baseUrl: apiUrl,
    });
  }, []);

  // The auth store's `persist` middleware rehydrates from localStorage
  // asynchronously, so the store starts out logged-out on every load/refresh
  // even when the user is actually logged in. Once rehydration completes,
  // push the restored token into the Dorisio client so requests are
  // authenticated without requiring a manual re-login, and avoid rendering
  // auth-dependent UI until then so users don't see a "logged out" flash.
  const syncToken = useCallback(
    (token: string | null) => {
      if (token) {
        dorisioClient.setToken(token);
      } else {
        dorisioClient.clearToken();
      }
    },
    [dorisioClient]
  );
  const { hasHydrated } = useAuthHydration(syncToken);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <CompatibleDorisioProvider client={dorisioClient} config={dorisioClient.getConfig()}>
          <NotificationProvider />
          {children}
        </CompatibleDorisioProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
