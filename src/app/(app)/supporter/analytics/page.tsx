'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useSupporterAnalytics } from '@/hooks/use-supporter-analytics';
import type { SupporterAnalyticsPeriod, SupporterSpendPoint } from '@/types/supporter-analytics';

const PERIODS: Array<{ value: SupporterAnalyticsPeriod; label: string }> = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function SpendingChart({ points }: { points: SupporterSpendPoint[] }): JSX.Element {
  if (points.length === 0) {
    return <div className="flex h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">Your confirmed tips will appear here.</div>;
  }

  const max = Math.max(...points.map((point) => point.amount), 1);
  const width = 720;
  const height = 220;
  const padding = 24;
  const coordinates = points.map((point, index) => ({
    x: points.length === 1 ? width / 2 : padding + (index / (points.length - 1)) * (width - padding * 2),
    y: height - padding - (point.amount / max) * (height - padding * 2),
  }));
  const path = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div>
      <svg role="img" aria-label="Spending over time" viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" preserveAspectRatio="none">
        <title>Confirmed tip spending over time</title>
        <path d={path} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" />
        {coordinates.map((point, index) => <circle key={points[index].date} cx={point.x} cy={point.y} r="4" className="fill-primary" />)}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{points[0].date}</span><span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}

function TipFrequencyChart({ points }: { points: SupporterSpendPoint[] }): JSX.Element {
  if (points.length === 0) return <p className="text-sm text-muted-foreground">No confirmed tips in this period.</p>;
  const maxCount = Math.max(...points.map((point) => point.tipCount), 1);
  return <div aria-label="Tip frequency over time" className="flex h-36 items-end gap-2 overflow-x-auto border-b px-2">
    {points.map((point) => <div key={point.date} title={`${point.date}: ${point.tipCount} ${point.tipCount === 1 ? 'tip' : 'tips'}`} className="flex h-full min-w-4 flex-1 flex-col items-center justify-end gap-1"><span className="text-xs text-muted-foreground">{point.tipCount}</span><div className="w-full max-w-10 rounded-t bg-primary/70" style={{ height: `${Math.max(8, (point.tipCount / maxCount) * 70)}%` }} /></div>)}
  </div>;
}

export default function SupporterAnalyticsPage(): JSX.Element {
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<SupporterAnalyticsPeriod>('30d');
  const { data, isLoading, isError, error, refetch } = useSupporterAnalytics(period);

  if (!user || user.role !== 'fan') {
    return <main className="mx-auto max-w-5xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">Supporter analytics</h1><p className="mt-2 text-muted-foreground">Sign in as a supporter to view your spending.</p><Link className="mt-4 inline-block text-primary underline" href="/auth/signin">Sign in</Link></main>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm text-muted-foreground">Your supporter account</p><h1 className="text-3xl font-bold">Spending analytics</h1><p className="mt-2 text-muted-foreground">A private overview of the tips you’ve sent and creators you support.</p></div>
        <label className="flex flex-col gap-1 text-sm font-medium">Time period<select aria-label="Time period" value={period} onChange={(event) => setPeriod(event.target.value as SupporterAnalyticsPeriod)} className="rounded-md border bg-background px-3 py-2">{PERIODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      </header>

      {isLoading && <div role="status" className="rounded-lg border p-8 text-center">Loading your spending analytics…</div>}
      {isError && <div role="alert" className="rounded-lg border border-destructive/40 p-6"><p>We couldn’t load your tip history: {error.message}</p><button type="button" onClick={() => void refetch()} className="mt-3 underline">Try again</button></div>}

      {data && <>
        <section aria-label="Spending summary" className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Total spending</p><p className="mt-2 text-3xl font-semibold">{currency.format(data.totalSpent)}</p></article>
          <article className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Confirmed tips</p><p className="mt-2 text-3xl font-semibold">{data.tipCount}</p></article>
          <article className="rounded-xl border p-5"><p className="text-sm text-muted-foreground">Average tip</p><p className="mt-2 text-3xl font-semibold">{currency.format(data.averageTip)}</p></article>
        </section>

        {data.tipCount === 0 ? <section className="rounded-xl border p-8 text-center"><h2 className="text-xl font-semibold">No confirmed tips in this period</h2><p className="mt-2 text-muted-foreground">Choose another time period or discover a creator to support.</p><Link href="/creators" className="mt-4 inline-block text-primary underline">Explore creators</Link></section> : <>
          <section className="rounded-xl border p-5"><h2 className="mb-4 text-xl font-semibold">Spending over time</h2><SpendingChart points={data.spendingOverTime} /></section>
          <section className="rounded-xl border p-5"><h2 className="mb-4 text-xl font-semibold">Tip frequency over time</h2><TipFrequencyChart points={data.spendingOverTime} /></section>
          <section className="rounded-xl border p-5"><h2 className="mb-4 text-xl font-semibold">Creators you support</h2>{data.topCreators.length === 0 ? <p className="text-muted-foreground">No creator details are available yet.</p> : <ol className="divide-y">{data.topCreators.map((creator, index) => <li key={creator.creatorId} className="flex items-center justify-between gap-4 py-3"><div className="flex min-w-0 items-center gap-3"><span className="text-sm text-muted-foreground">{index + 1}</span><div className="min-w-0"><p className="truncate font-medium">{creator.username ? <Link href={`/creators/${encodeURIComponent(creator.username)}`} className="hover:underline">{creator.creatorName}</Link> : creator.creatorName}</p><p className="text-sm text-muted-foreground">{creator.tipCount} {creator.tipCount === 1 ? 'tip' : 'tips'}</p></div></div><p className="font-semibold">{currency.format(creator.amount)}</p></li>)}</ol>}</section>
        </>}
      </>}
    </main>
  );
}
