'use client';

import { ReactNode, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { DorisioClient } from 'dorisio-sdk';
import { DorisioProvider } from 'dorisio-sdk/react';
import { ThemeProvider } from '@/components/theme-provider';
import { NotificationProvider } from '@/components/notification-provider';
import { getQueryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  const queryClient = getQueryClient();

  // Initialize Dorisio client
  const dorisioClient = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return new DorisioClient({
      baseUrl: apiUrl,
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <DorisioProvider client={dorisioClient} config={dorisioClient.getConfig()}>
          <NotificationProvider />
          {children}
        </DorisioProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
