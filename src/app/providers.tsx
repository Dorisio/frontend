'use client';

import { ReactNode, useCallback, useEffect, useMemo, type ComponentType } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DorisioClient, type ClientConfig } from 'dorisio-sdk';
import { DorisioProvider } from 'dorisio-sdk/react';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { getQueryClient } from '@/lib/query-client';
import { useAuthHydration } from '@/hooks/use-auth-hydration';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { BackgroundRefreshIndicator } from '@/components/shared/background-refresh-indicator';
import { RouteTracker } from '@/components/route-tracker';
import { useAuthStore } from '@/stores/auth-store';
import { setMonitoringUser } from '@/lib/monitoring';
import { startMemoryMonitor } from '@/lib/memory-monitor';
import { I18nProvider } from '@/lib/i18n';
import { registerServiceWorker } from '@/lib/push-notifications';

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

  // Keep Sentry's user context in sync with the signed-in user so error
  // reports can be grouped by the affected account.
  const user = useAuthStore((state) => state.user);
  useEffect(() => {
    setMonitoringUser(user ? { id: user.id, email: user.email, username: user.username } : null);
  }, [user]);

  useEffect(() => initPerformanceMonitoring(), []);

  // Sample the JS heap for the lifetime of the app so sustained growth is
  // reported to Sentry (and available via window.__dorisioMemory in dev).
  // Set NEXT_PUBLIC_MEMORY_MONITOR=off to disable in a given environment.
  useEffect(() => {
    const monitor = startMemoryMonitor();
    return () => monitor.stop();
  }, []);

  // Register the push notification service worker as soon as the app boots.
  // Registration alone is silent (no permission prompt, no subscription) -
  // it just makes the worker available so that a later subscribe() call
  // (from the dashboard prompt or settings toggle) doesn't have to wait on
  // registration first. Errors are logged and swallowed inside
  // registerServiceWorker() itself so this never blocks app boot.
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <I18nProvider>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <CompatibleDorisioProvider client={dorisioClient} config={dorisioClient.getConfig()}>
          <NotificationProvider />
          <BackgroundRefreshIndicator />
          <RouteTracker />
          {children}
        </CompatibleDorisioProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </I18nProvider>
  );
}
