/**
 * Creator Analytics API Route
 *
 * Serves analytics data for the creator analytics dashboard
 * (`/creators/[username]/analytics`).
 *
 * Scoping note: `dorisio-sdk` has no analytics endpoint - only per-transaction
 * history (`getFullTransactionHistory`) and a plain earnings summary
 * (`getCreatorEarnings`). Building a full backend analytics pipeline (tip
 * source/category tracking, per-tipper aggregation, etc.) is out of scope for
 * this change. This route returns a well-typed, deterministically generated
 * response matching the `CreatorAnalytics` shape in `src/types/index.ts` so
 * the dashboard has real data to render against; replace the body of
 * `buildAnalytics` with a real backend/SDK call once one exists.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  AnalyticsDateRangePreset,
  CreatorAnalytics,
  EarningsTrendPoint,
  TipSourceBreakdownEntry,
  TopTipper,
} from '@/types';

const VALID_RANGES: AnalyticsDateRangePreset[] = ['30d', '90d', 'ytd'];

function rangeToDays(range: AnalyticsDateRangePreset, now: Date): number {
  switch (range) {
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'ytd': {
      const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const diffMs = now.getTime() - startOfYear.getTime();
      return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }
    default:
      return 30;
  }
}

/** Small deterministic PRNG seeded from a string, so the same
 * username+range always renders the same mock data (stable for tests and
 * for a given user's dashboard between refreshes) without needing a real
 * data source. */
function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  let state = h >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildEarningsTrend(
  username: string,
  range: AnalyticsDateRangePreset,
  now: Date
): EarningsTrendPoint[] {
  const days = rangeToDays(range, now);
  const random = seededRandom(`${username}:${range}:trend`);
  const points: EarningsTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    // Base daily earnings with some randomness and a mild upward trend
    // toward the present, so the chart has a believable shape.
    const trendFactor = 1 + ((days - i) / days) * 0.4;
    const amount = Math.round(random() * 80 * trendFactor * 100) / 100;
    points.push({ date: toISODate(date), amount });
  }

  return points;
}

const TIP_SOURCES = ['Profile page', 'Embed widget', 'Shared link', 'Social media'];

function buildSourceBreakdown(
  username: string,
  range: AnalyticsDateRangePreset,
  earningsTrend: EarningsTrendPoint[]
): TipSourceBreakdownEntry[] {
  const random = seededRandom(`${username}:${range}:sources`);
  const totalAmount = earningsTrend.reduce((sum, p) => sum + p.amount, 0);

  // Split total earnings across sources using random weights that sum to 1.
  const weights = TIP_SOURCES.map(() => random());
  const weightSum = weights.reduce((sum, w) => sum + w, 0) || 1;

  return TIP_SOURCES.map((source, i) => {
    const share = weights[i] / weightSum;
    const amount = Math.round(totalAmount * share * 100) / 100;
    const count = Math.max(1, Math.round(amount / 8));
    return { source, amount, count };
  });
}

const TIPPER_NAMES = [
  'Jonas K.',
  'Sofia R.',
  'Dev Patel',
  'Amara N.',
  'Liam O.',
  'Grace T.',
  'Noah S.',
  'Mia L.',
];

function buildTopTippers(
  username: string,
  range: AnalyticsDateRangePreset,
  now: Date
): TopTipper[] {
  const random = seededRandom(`${username}:${range}:tippers`);

  return TIPPER_NAMES.map((name, i) => {
    const totalAmount = Math.round(random() * 300 * 100) / 100;
    const tipCount = Math.max(1, Math.round(random() * 12));
    const daysAgo = Math.floor(random() * 14);
    const lastTipDate = new Date(now);
    lastTipDate.setUTCDate(lastTipDate.getUTCDate() - daysAgo);

    return {
      id: `tipper-${i}`,
      name,
      totalAmount,
      tipCount,
      lastTipAt: lastTipDate.toISOString(),
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);
}

function buildAnalytics(username: string, range: AnalyticsDateRangePreset): CreatorAnalytics {
  // Anchored to the start of the current UTC day (not the live clock) so that
  // two calls within the same day produce byte-identical output, this is a
  // deterministic mock data source and must be stable across immediate
  // successive requests for the same username+range.
  const today = new Date();
  const now = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const days = rangeToDays(range, now);
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

  const earningsTrend = buildEarningsTrend(username, range, now);
  const sourceBreakdown = buildSourceBreakdown(username, range, earningsTrend);
  const topTippers = buildTopTippers(username, range, now);

  const totalEarnings = Math.round(earningsTrend.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const last7 = earningsTrend.slice(-7);
  const last30 = earningsTrend.slice(-30);
  const earningsThisWeek = Math.round(last7.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const earningsThisMonth = Math.round(last30.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
  const totalTips = sourceBreakdown.reduce((sum, s) => sum + s.count, 0);

  return {
    range,
    startDate: toISODate(startDate),
    endDate: toISODate(now),
    summary: {
      totalEarnings,
      earningsThisMonth,
      earningsThisWeek,
      totalTips,
    },
    earningsTrend,
    sourceBreakdown,
    topTippers,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
): Promise<NextResponse> {
  try {
    const username = decodeURIComponent(params.username);
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const rangeParam = request.nextUrl.searchParams.get('range');
    const range: AnalyticsDateRangePreset = VALID_RANGES.includes(
      rangeParam as AnalyticsDateRangePreset
    )
      ? (rangeParam as AnalyticsDateRangePreset)
      : '30d';

    const analytics = buildAnalytics(username, range);

    return NextResponse.json(analytics);
  } catch (err) {
    console.error('Failed to build creator analytics:', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
