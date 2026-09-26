'use client';

import { useIsFetching } from '@tanstack/react-query';

/** A non-blocking status indicator for stale-while-revalidate requests. */
export function BackgroundRefreshIndicator(): JSX.Element | null {
  const fetching = useIsFetching();
  if (!fetching) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 rounded-full border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm"
    >
      Updating…
    </div>
  );
}
