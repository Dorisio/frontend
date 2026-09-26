import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreatorAnalytics } from './use-creator-analytics';
import type { CreatorAnalytics } from '@/types';

const sampleAnalytics: CreatorAnalytics = {
  range: '30d',
  startDate: '2026-01-01',
  endDate: '2026-01-30',
  summary: { totalEarnings: 100, earningsThisMonth: 100, earningsThisWeek: 25, totalTips: 10 },
  earningsTrend: [{ date: '2026-01-01', amount: 10 }],
  sourceBreakdown: [{ source: 'Profile page', amount: 100, count: 10 }],
  topTippers: [],
};

function createWrapper(): { wrapper: (props: { children: ReactNode }) => JSX.Element } {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useCreatorAnalytics', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => sampleAnalytics,
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches analytics for the given username and default range', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatorAnalytics('alice'), { wrapper });

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleAnalytics);
    expect(fetch).toHaveBeenCalledWith('/api/creators/alice/analytics?range=30d');
  });

  it('refetches with updated params when the range changes', async () => {
    const { wrapper } = createWrapper();
    const { result, rerender } = renderHook(
      ({ range }: { range: '30d' | '90d' | 'ytd' }) =>
        useCreatorAnalytics('alice', { preset: range }),
      { wrapper, initialProps: { range: '30d' } }
    );

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith('/api/creators/alice/analytics?range=30d');

    rerender({ range: '90d' });

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/creators/alice/analytics?range=90d');
    });
  });

  it('does not fetch when username is not provided', () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatorAnalytics(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('surfaces an error when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreatorAnalytics('alice'), { wrapper });

    await vi.waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
