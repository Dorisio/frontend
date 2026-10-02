'use client';

import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const RETRY_WARN_THRESHOLD = 1;

/** A non-blocking status indicator for stale-while-revalidate requests. */
export function BackgroundRefreshIndicator(): JSX.Element | null {
  const fetching = useIsFetching();
  const queryClient = useQueryClient();
  const [retryInfo, setRetryInfo] = useState<{ count: number; queryKey: string } | null>(
    null,
  );
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cache = queryClient.getQueryCache();

    const unsubscribe = cache.subscribe(event => {
      if (event.type !== 'updated') return;
      const query = event.query;
      const state = query.state;
      const failureCount = state.fetchFailureCount ?? 0;
      const fetchStatus = state.fetchStatus;

      if (failureCount > 0 && fetchStatus === 'fetching') {
        const key = JSON.stringify(query.queryKey);
        setRetryInfo({ count: failureCount, queryKey: key });

        if (timerIdRef.current !== null) {
          clearTimeout(timerIdRef.current);
        }
        timerIdRef.current = setTimeout(() => {
          setRetryInfo(null);
          timerIdRef.current = null;
        }, 3000);
      } else if (fetchStatus !== 'fetching') {
        setRetryInfo(null);
        if (timerIdRef.current !== null) {
          clearTimeout(timerIdRef.current);
          timerIdRef.current = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerIdRef.current !== null) {
        clearTimeout(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [queryClient]);

  const isRetrying = retryInfo !== null && retryInfo.count >= RETRY_WARN_THRESHOLD;

  if (!fetching && !isRetrying) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50 rounded-full border bg-background/95 px-3 py-1.5 text-xs shadow-sm',
        isRetrying ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
      )}
    >
      {isRetrying
        ? `Retrying… (attempt ${retryInfo.count})`
        : 'Updating…'}
    </div>
  );
}
