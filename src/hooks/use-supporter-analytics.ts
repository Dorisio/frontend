'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useSDKClient } from '@/lib/sdk-client';
import { calculateSupporterAnalytics } from '@/lib/supporter-analytics';
import type { SupporterAnalytics, SupporterAnalyticsPeriod, SupporterCreator, SupporterTransaction } from '@/types/supporter-analytics';

interface HistoryPage {
  transactions: Array<{ id: string; creatorId: string; amount: number; status: 'pending' | 'confirmed' | 'failed'; createdAt: string }>;
  total: number;
  page: number;
  pageSize: number;
}

interface CreatorPage {
  creators: SupporterCreator[];
  total: number;
  page: number;
  pageSize: number;
}

interface AnalyticsClient {
  getTransactionHistory(options: { page: number; pageSize: number }): Promise<HistoryPage>;
  listCreators(options: { page: number; pageSize: number }): Promise<CreatorPage>;
}

async function loadAllPages<TPage extends { total: number; pageSize: number }>(
  fetchPage: (page: number, pageSize: number) => Promise<TPage>,
  getItems: (page: TPage) => SupporterTransaction[] | SupporterCreator[],
): Promise<Array<SupporterTransaction | SupporterCreator>> {
  const pageSize = 100;
  const firstPage = await fetchPage(1, pageSize);
  const items: Array<SupporterTransaction | SupporterCreator> = [...getItems(firstPage)];
  const pageCount = firstPage.pageSize > 0 ? Math.ceil(firstPage.total / firstPage.pageSize) : 1;
  for (let page = 2; page <= pageCount; page += 1) {
    const result = await fetchPage(page, pageSize);
    items.push(...getItems(result));
  }
  return items;
}

async function fetchSupporterAnalytics(client: AnalyticsClient, period: SupporterAnalyticsPeriod): Promise<SupporterAnalytics> {
  const [transactions, creators] = await Promise.all([
    loadAllPages((page, pageSize) => client.getTransactionHistory({ page, pageSize }), (page) => page.transactions),
    loadAllPages((page, pageSize) => client.listCreators({ page, pageSize }), (page) => page.creators),
  ]);
  return calculateSupporterAnalytics(
    transactions as SupporterTransaction[],
    creators as SupporterCreator[],
    period,
  );
}

export function useSupporterAnalytics(period: SupporterAnalyticsPeriod): UseQueryResult<SupporterAnalytics, Error> {
  const client = useSDKClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: ['supporterAnalytics', userId, period],
    queryFn: () => fetchSupporterAnalytics(client as unknown as AnalyticsClient, period),
    enabled: Boolean(userId),
  });
}
