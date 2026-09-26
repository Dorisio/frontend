/**
 * Creator Analytics Page
 * Private analytics dashboard at /creators/[username]/analytics
 * Shows earnings trends, tip source breakdown, top tippers, and report exports.
 */

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useCreatorAnalytics } from '@/hooks/use-creator-analytics';
import { AnalyticsSummaryCards } from '@/components/sections/analytics-summary-cards';
import { AnalyticsDateRangePicker } from '@/components/sections/analytics-date-range-picker';
import { TopTippersTable } from '@/components/sections/top-tippers-table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { downloadAnalyticsCsv, downloadAnalyticsExcel, printAnalyticsPdf } from '@/lib/csv-export';
import type { AnalyticsDateRangePreset } from '@/types';

const ChartLoading = (): JSX.Element => (
  <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
    Loading chart...
  </div>
);

const EarningsTrendChart = dynamic(
  () =>
    import('@/components/sections/earnings-trend-chart').then(
      (module) => module.EarningsTrendChart
    ),
  { ssr: false, loading: ChartLoading }
);

const TipSourceBreakdown = dynamic(
  () =>
    import('@/components/sections/tip-source-breakdown').then(
      (module) => module.TipSourceBreakdown
    ),
  { ssr: false, loading: ChartLoading }
);

export default function CreatorAnalyticsPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const user = useAuthStore((state) => state.user);
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [range, setRange] = useState<AnalyticsDateRangePreset>('30d');
  const [customRange, setCustomRange] = useState({ startDate: thirtyDaysAgo, endDate: today });

  const { data, isLoading, isError, error } = useCreatorAnalytics(username, {
    preset: range,
    startDate: customRange.startDate,
    endDate: customRange.endDate,
  });

  // Mirrors the auth guard used by the sibling `/creators/[username]/dashboard`
  // page: only the creator viewing their own analytics can see this page.
  useEffect(() => {
    if (user && user.username !== username) {
      router.replace(`/creators/${username}`);
    }
  }, [user, username, router]);

  if (!user || user.username !== username) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You can only view your own analytics.</p>
        <Link href="/creators" className="text-primary hover:underline">
          Back to Creators
        </Link>
      </div>
    );
  }

  function handleExportCsv(): void {
    if (!data) return;
    const suffix =
      range === 'custom' ? `${customRange.startDate}-to-${customRange.endDate}` : range;
    downloadAnalyticsCsv(data, `dorisio-analytics-${username}-${suffix}.csv`);
  }

  function handleExportExcel(): void {
    if (!data) return;
    const suffix =
      range === 'custom' ? `${customRange.startDate}-to-${customRange.endDate}` : range;
    downloadAnalyticsExcel(data, `dorisio-analytics-${username}-${suffix}.xls`);
  }

  function handleExportPdf(): void {
    if (!data) return;
    printAnalyticsPdf(data, `${username} Creator Analytics`);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Creator Analytics</h1>
          <p className="text-muted-foreground">Earnings trends, tip sources, and top supporters</p>
        </div>
        <div className="flex items-center gap-3">
          <AnalyticsDateRangePicker
            value={range}
            startDate={customRange.startDate}
            endDate={customRange.endDate}
            onChange={setRange}
            onCustomDateChange={(field, value) =>
              setCustomRange((current) => ({ ...current, [field]: value }))
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCsv}
            disabled={!data || isLoading}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportExcel}
            disabled={!data || isLoading}
          >
            Export Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={!data || isLoading}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <p className="text-sm">
            Failed to load analytics{error instanceof Error ? `: ${error.message}` : ''}
          </p>
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <AnalyticsSummaryCards summary={data.summary} />

          {/* Earnings Trend */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-bold">Earnings Trend</h2>
            <EarningsTrendChart data={data.earningsTrend} />
          </Card>

          {/* Source Breakdown + Top Tippers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Tip Source Breakdown</h2>
              <TipSourceBreakdown data={data.sourceBreakdown} />
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Top Tippers</h2>
              <TopTippersTable data={data.topTippers} />
            </Card>
          </div>
        </>
      )}

      {/* Action Links */}
      <div className="flex gap-4 pt-4">
        <Link
          href={`/creators/${username}/dashboard`}
          className="px-6 py-2 border rounded-lg hover:bg-muted transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
