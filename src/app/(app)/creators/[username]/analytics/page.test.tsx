import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreatorAnalytics } from '@/types';

const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ username: 'alice' }),
  useRouter: () => ({ replace: replaceMock }),
}));

const useAuthStoreMock = vi.fn();
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => useAuthStoreMock(selector),
}));

const sampleAnalytics: CreatorAnalytics = {
  range: '30d',
  startDate: '2026-01-01',
  endDate: '2026-01-30',
  summary: { totalEarnings: 500, earningsThisMonth: 200, earningsThisWeek: 50, totalTips: 20 },
  earningsTrend: [
    { date: '2026-01-01', amount: 10 },
    { date: '2026-01-02', amount: 20 },
  ],
  sourceBreakdown: [
    { source: 'Profile page', amount: 300, count: 12 },
    { source: 'Embed widget', amount: 200, count: 8 },
  ],
  topTippers: [
    { id: '1', name: 'Bob', totalAmount: 100, tipCount: 5, lastTipAt: '2026-01-10T00:00:00.000Z' },
  ],
};

const useCreatorAnalyticsMock = vi.fn();
vi.mock('@/hooks/use-creator-analytics', () => ({
  useCreatorAnalytics: (username: string | null | undefined, range: string) =>
    useCreatorAnalyticsMock(username, range),
}));

const downloadAnalyticsCsvMock = vi.fn();
vi.mock('@/lib/csv-export', () => ({
  downloadAnalyticsCsv: (...args: unknown[]) => downloadAnalyticsCsvMock(...args),
}));

import CreatorAnalyticsPage from './page';

function mockAuthenticatedAs(username: string): void {
  useAuthStoreMock.mockImplementation((selector: (state: { user: unknown }) => unknown) =>
    selector({ user: { id: '1', username, email: 'a@b.com', role: 'creator' } })
  );
}

describe('CreatorAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedAs('alice');
    useCreatorAnalyticsMock.mockReturnValue({
      data: sampleAnalytics,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("denies access when viewing another creator's analytics", () => {
    mockAuthenticatedAs('someone-else');

    render(<CreatorAnalyticsPage />);

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders the page for the creator viewing their own analytics', () => {
    render(<CreatorAnalyticsPage />);

    expect(screen.getByText('Creator Analytics')).toBeInTheDocument();
  });

  it('shows summary cards with correct values from the fetched data', () => {
    render(<CreatorAnalyticsPage />);

    expect(screen.getByTestId('summary-total-earnings')).toHaveTextContent('$500.00');
    expect(screen.getByTestId('summary-earnings-month')).toHaveTextContent('$200.00');
    expect(screen.getByTestId('summary-earnings-week')).toHaveTextContent('$50.00');
  });

  it('renders the earnings trend chart, source breakdown, and top tippers table', () => {
    render(<CreatorAnalyticsPage />);

    expect(screen.getByTestId('earnings-trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('tip-source-breakdown-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-tippers-table')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows a loading state while analytics are being fetched', () => {
    useCreatorAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<CreatorAnalyticsPage />);

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it('shows an error state when the fetch fails', () => {
    useCreatorAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network down'),
    });

    render(<CreatorAnalyticsPage />);

    expect(screen.getByText(/failed to load analytics/i)).toBeInTheDocument();
  });

  it('refetches with the updated range when a date range preset is selected', async () => {
    const user = userEvent.setup();
    render(<CreatorAnalyticsPage />);

    expect(useCreatorAnalyticsMock).toHaveBeenCalledWith('alice', '30d');

    await user.click(screen.getByRole('button', { name: '90 Days' }));

    expect(useCreatorAnalyticsMock).toHaveBeenCalledWith('alice', '90d');
  });

  it('exports a CSV with the currently loaded data and range when Export CSV is clicked', async () => {
    const user = userEvent.setup();
    render(<CreatorAnalyticsPage />);

    await user.click(screen.getByRole('button', { name: 'Export CSV' }));

    expect(downloadAnalyticsCsvMock).toHaveBeenCalledWith(
      sampleAnalytics,
      'dorisio-analytics-alice-30d.csv'
    );
  });

  it('disables the Export CSV button while data is loading', () => {
    useCreatorAnalyticsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    render(<CreatorAnalyticsPage />);

    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });
});
