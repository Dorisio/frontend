/**
 * useCreatorAnalytics Hook
 *
 * Fetches analytics data (earnings trend, tip source breakdown, top
 * tippers, summary totals) for a creator's analytics dashboard.
 *
 * The `dorisio-sdk` package has no analytics endpoint, so this calls a
 * Next.js API route under this app (`/api/creators/[username]/analytics`)
 * instead of the SDK client - see that route for the scoping note. Uses
 * React Query directly (as configured in `src/lib/query-client.ts`) since
 * this data isn't part of the SDK's own React hook surface.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AnalyticsDateRangePreset, CreatorAnalytics } from '@/types';

async function fetchCreatorAnalytics(
  username: string,
  range: AnalyticsDateRangePreset
): Promise<CreatorAnalytics> {
  const response = await fetch(
    `/api/creators/${encodeURIComponent(username)}/analytics?range=${range}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch creator analytics (status ${response.status})`);
  }

  return response.json() as Promise<CreatorAnalytics>;
}

export function useCreatorAnalytics(
  username: string | null | undefined,
  range: AnalyticsDateRangePreset = '30d'
): UseQueryResult<CreatorAnalytics, Error> {
  return useQuery({
    queryKey: ['creatorAnalytics', username, range],
    queryFn: () => fetchCreatorAnalytics(username as string, range),
    enabled: Boolean(username),
  });
}
