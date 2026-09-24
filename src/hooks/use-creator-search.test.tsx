import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/sdk-client', () => ({
  useSDKClient: vi.fn(() => ({ listCreators: vi.fn() })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// applyClientFilters / sortCreators aren't exported directly, so we test
// them through the hook's public surface via renderHook where practical,
// and via a small re-implementation-free integration test using the actual
// module's exported hook with a mocked query.
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCreatorSearch } from './use-creator-search';
import { useSDKClient } from '@/lib/sdk-client';
import type { Creator } from '@/types';

const creators: Creator[] = [
  {
    id: '1',
    userId: 'u1',
    username: 'zara',
    displayName: 'Zara',
    verified: true,
    isPublic: true,
    totalEarnings: 100,
    pendingBalance: 0,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'u2',
    username: 'alex',
    displayName: 'Alex',
    verified: false,
    isPublic: true,
    totalEarnings: 500,
    pendingBalance: 0,
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: '3',
    userId: 'u3',
    username: 'mira',
    displayName: 'Mira',
    bio: 'digital artist',
    verified: false,
    isPublic: true,
    totalEarnings: 10,
    pendingBalance: 0,
    createdAt: '2025-12-01T00:00:00Z',
  },
];

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useCreatorSearch', () => {
  it('returns creators from the SDK sorted by trending (earnings) by default', async () => {
    vi.mocked(useSDKClient).mockReturnValue({
      listCreators: vi.fn().mockResolvedValue({ creators, total: 3, page: 1, pageSize: 20 }),
    } as unknown as ReturnType<typeof useSDKClient>);

    const { result } = renderHook(() => useCreatorSearch(), { wrapper });

    await waitFor(() => expect(result.current.creators).toHaveLength(3));
    expect(result.current.creators.map((c) => c.id)).toEqual(['2', '1', '3']);
  });

  it('sorts alphabetically when the sort filter changes', async () => {
    vi.mocked(useSDKClient).mockReturnValue({
      listCreators: vi.fn().mockResolvedValue({ creators, total: 3, page: 1, pageSize: 20 }),
    } as unknown as ReturnType<typeof useSDKClient>);

    const { result } = renderHook(() => useCreatorSearch(), { wrapper });
    await waitFor(() => expect(result.current.creators).toHaveLength(3));

    result.current.setFilter('sort', 'alphabetical');

    await waitFor(() =>
      expect(result.current.creators.map((c) => c.displayName)).toEqual(['Alex', 'Mira', 'Zara'])
    );
  });

  it('filters by minimum earnings', async () => {
    vi.mocked(useSDKClient).mockReturnValue({
      listCreators: vi.fn().mockResolvedValue({ creators, total: 3, page: 1, pageSize: 20 }),
    } as unknown as ReturnType<typeof useSDKClient>);

    const { result } = renderHook(() => useCreatorSearch(), { wrapper });
    await waitFor(() => expect(result.current.creators).toHaveLength(3));

    result.current.setFilter('minEarnings', '50');

    await waitFor(() =>
      expect(result.current.creators.map((c) => c.id).sort()).toEqual(['1', '2'])
    );
  });

  it('resets page to 1 when a non-page filter changes', async () => {
    vi.mocked(useSDKClient).mockReturnValue({
      listCreators: vi.fn().mockResolvedValue({ creators, total: 3, page: 1, pageSize: 20 }),
    } as unknown as ReturnType<typeof useSDKClient>);

    const { result } = renderHook(() => useCreatorSearch(), { wrapper });
    await waitFor(() => expect(result.current.creators).toHaveLength(3));

    result.current.setFilter('page', 3);
    await waitFor(() => expect(result.current.filters.page).toBe(3));

    result.current.setFilter('search', 'zara');
    await waitFor(() => expect(result.current.filters.page).toBe(1));
  });

  it('resetFilters clears all filters back to defaults', async () => {
    vi.mocked(useSDKClient).mockReturnValue({
      listCreators: vi.fn().mockResolvedValue({ creators, total: 3, page: 1, pageSize: 20 }),
    } as unknown as ReturnType<typeof useSDKClient>);

    const { result } = renderHook(() => useCreatorSearch(), { wrapper });
    await waitFor(() => expect(result.current.creators).toHaveLength(3));

    result.current.setFilter('verifiedOnly', true);
    result.current.setFilter('minEarnings', '10');
    result.current.resetFilters();

    await waitFor(() => {
      expect(result.current.filters.verifiedOnly).toBe(false);
      expect(result.current.filters.minEarnings).toBe('');
    });
  });
});
