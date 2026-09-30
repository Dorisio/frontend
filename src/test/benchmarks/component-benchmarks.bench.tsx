import { describe, bench } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Badge,
} from '@/components/ui';
import { Avatar } from '@/components/shared/avatar';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ProfileHeaderSkeleton } from '@/components/shared/creator-skeletons';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorMessage } from '@/components/shared/error-message';
import { CreatorVerificationBadge } from '@/components/shared/creator-verification-badge';
import { SupporterBadge } from '@/components/shared/supporter-badge';
import { SubscriberBadge } from '@/components/shared/subscriber-badge';
import { CreatorBio } from '@/components/sections/creator-bio';
import { CreatorPortfolio } from '@/components/sections/creator-portfolio';
import { CreatorSearchBar } from '@/components/sections/creator-search-bar';
import DorisioButton from '@/components/sections/dorisio-button';
import { TransactionFilterBar } from '@/components/sections/transaction-filter-bar';
import { TipSourceBreakdown } from '@/components/sections/tip-source-breakdown';
import { TopTippersTable } from '@/components/sections/top-tippers-table';
import { SupporterLeaderboard } from '@/components/sections/supporter-leaderboard';
import { AnalyticsSummaryCards } from '@/components/sections/analytics-summary-cards';
import { AnalyticsDateRangePicker } from '@/components/sections/analytics-date-range-picker';
import { EarningsTrendChart } from '@/components/sections/earnings-trend-chart';
import { SubscriptionTiers } from '@/components/sections/subscription-tiers';
import { SubscriptionManagement } from '@/components/sections/subscription-management';
import { SubscriptionSettings } from '@/components/sections/subscription-settings';
import type { CreatorSearchFilters } from '@/hooks/use-creator-search';
import type { TransactionFilterState } from '@/hooks/use-transaction-filter';

// -----------------------------------------------------------------------------
// Benchmark infrastructure
// -----------------------------------------------------------------------------

// Thresholds are in milliseconds and represent the maximum allowed mean
// render time for a single mount of the component. They are consumed by
// scripts/check-perf-thresholds.js via the benchmark report file.
export const PERF_THRESHOLDS: Record<string, number> = {
  Button: 5,
  Card: 5,
  Input: 5,
  Label: 3,
  Badge: 3,
  Avatar: 5,
  LoadingSpinner: 5,
  ProfileHeaderSkeleton: 5,
  EmptyState: 8,
  ErrorMessage: 5,
  CreatorVerificationBadge: 5,
  SupporterBadge: 5,
  SubscriberBadge: 5,
  CreatorBio: 10,
  CreatorPortfolio: 15,
  CreatorSearchBar: 10,
  DorisioButton: 5,
  TransactionFilterBar: 15,
  TipSourceBreakdown: 20,
  TopTippersTable: 25,
  SupporterLeaderboard: 25,
  AnalyticsSummaryCards: 20,
  AnalyticsDateRangePicker: 15,
  EarningsTrendChart: 30,
  SubscriptionTiers: 20,
  SubscriptionManagement: 20,
  SubscriptionSettings: 20,
};

// Registry of components to benchmark. Each entry renders the component
// with realistic props so the measured time reflects actual usage.
export interface BenchmarkCase {
  name: string;
  render: () => React.ReactElement;
}

const noop = () => {};

const SEARCH_FILTERS: CreatorSearchFilters = {
  search: '',
  verifiedOnly: false,
  minEarnings: '',
  maxEarnings: '',
  sort: 'trending',
  page: 1,
};

const TRANSACTION_FILTERS: TransactionFilterState = {
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  messageKeyword: '',
  status: 'all',
  sortField: 'date',
  sortDirection: 'desc',
};

export const BENCHMARK_CASES: BenchmarkCase[] = [
  {
    name: 'Button',
    render: () => <Button>Click me</Button>,
  },
  {
    name: 'Card',
    render: () => (
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    ),
  },
  {
    name: 'Input',
    render: () => <Input placeholder="Amount" />,
  },
  {
    name: 'Label',
    render: () => <Label htmlFor="amount">Amount</Label>,
  },
  {
    name: 'Badge',
    render: () => <Badge>Active</Badge>,
  },
  {
    name: 'Avatar',
    render: () => <Avatar src="/avatar.png" alt="Creator" />,
  },
  {
    name: 'LoadingSpinner',
    render: () => <LoadingSpinner />,
  },
  {
    name: 'ProfileHeaderSkeleton',
    render: () => <ProfileHeaderSkeleton />,
  },
  {
    name: 'EmptyState',
    render: () => <EmptyState title="No results" description="Try again later" />,
  },
  {
    name: 'ErrorMessage',
    render: () => <ErrorMessage message="Something went wrong" />,
  },
  {
    name: 'CreatorVerificationBadge',
    render: () => <CreatorVerificationBadge verified />,
  },
  {
    name: 'SupporterBadge',
    render: () => <SupporterBadge tier="gold" />,
  },
  {
    name: 'SubscriberBadge',
    render: () => <SubscriberBadge />,
  },
  {
    name: 'CreatorBio',
    render: () => <CreatorBio value="Creator biography text" />,
  },
  {
    name: 'CreatorPortfolio',
    render: () => <CreatorPortfolio mediaItems={[]} externalLinks={[]} />,
  },
  {
    name: 'CreatorSearchBar',
    render: () => (
      <CreatorSearchBar filters={SEARCH_FILTERS} onChange={noop} onReset={noop} />
    ),
  },
  {
    name: 'DorisioButton',
    render: () => <DorisioButton creatorId="creator-1" />,
  },
  {
    name: 'TransactionFilterBar',
    render: () => (
      <TransactionFilterBar
        filters={TRANSACTION_FILTERS}
        onChange={noop}
        onReset={noop}
        onExport={noop}
        resultCount={0}
      />
    ),
  },
  {
    name: 'TipSourceBreakdown',
    render: () => <TipSourceBreakdown data={[]} />,
  },
  {
    name: 'TopTippersTable',
    render: () => <TopTippersTable data={[]} />,
  },
  {
    name: 'SupporterLeaderboard',
    render: () => <SupporterLeaderboard entries={[]} />,
  },
  {
    name: 'AnalyticsSummaryCards',
    render: () => (
      <AnalyticsSummaryCards
        summary={{
          totalEarnings: 0,
          earningsThisMonth: 0,
          earningsThisWeek: 0,
          totalTips: 0,
        }}
      />
    ),
  },
  {
    name: 'AnalyticsDateRangePicker',
    render: () => <AnalyticsDateRangePicker value="30d" onChange={noop} />,
  },
  {
    name: 'EarningsTrendChart',
    render: () => <EarningsTrendChart data={[]} />,
  },
  {
    name: 'SubscriptionTiers',
    render: () => <SubscriptionTiers creatorId="creator-1" />,
  },
  {
    name: 'SubscriptionManagement',
    render: () => <SubscriptionManagement creatorId="creator-1" />,
  },
  {
    name: 'SubscriptionSettings',
    render: () => <SubscriptionSettings creatorId="creator-1" />,
  },
];

// -----------------------------------------------------------------------------
// Benchmark suite
// -----------------------------------------------------------------------------

describe('component render performance', () => {
  for (const benchmarkCase of BENCHMARK_CASES) {
    bench(benchmarkCase.name, () => {
      const { unmount } = render(benchmarkCase.render());
      unmount();
    });
  }
});

// Expose the case list and thresholds for the CI threshold checker.
if (typeof globalThis !== 'undefined') {
  (globalThis as typeof globalThis & {
    __PERF_THRESHOLDS__: Record<string, number>;
    __PERF_CASES__: string[];
  }).__PERF_THRESHOLDS__ = PERF_THRESHOLDS;
  (globalThis as typeof globalThis & {
    __PERF_THRESHOLDS__: Record<string, number>;
    __PERF_CASES__: string[];
  }).__PERF_CASES__ = BENCHMARK_CASES.map((c) => c.name);
}
