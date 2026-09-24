/**
 * useCreatorInfiniteScroll Hook
 * Infinite scroll pagination for creator discovery using TanStack Query's
 * useInfiniteQuery. Supports debounced search, filtering, sorting, and
 * URL param syncing for shareable searches.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSDKClient } from '@/lib/sdk-client';
import type { Creator } from '@/types';

export type CreatorSortOption = 'trending' | 'newest' | 'alphabetical' | 'earnings';

export interface CreatorSearchFilters {
  search: string;
  verifiedOnly: boolean;
  minEarnings: string;
  maxEarnings: string;
  sort: CreatorSortOption;
}

const DEFAULT_FILTERS: CreatorSearchFilters = {
  search: '',
  verifiedOnly: false,
  minEarnings: '',
  maxEarnings: '',
  sort: 'trending',
};

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

function filtersFromSearchParams(params: URLSearchParams): CreatorSearchFilters {
  return {
    search: params.get('search') || DEFAULT_FILTERS.search,
    verifiedOnly: params.get('verified') === 'true',
    minEarnings: params.get('minEarnings') || DEFAULT_FILTERS.minEarnings,
    maxEarnings: params.get('maxEarnings') || DEFAULT_FILTERS.maxEarnings,
    sort: (params.get('sort') as CreatorSortOption) || DEFAULT_FILTERS.sort,
  };
}

function sortCreators(creators: Creator[], sort: CreatorSortOption): Creator[] {
  const sorted = [...creators];

  switch (sort) {
    case 'alphabetical':
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'earnings':
    case 'trending':
      return sorted.sort((a, b) => b.totalEarnings - a.totalEarnings);
    default:
      return sorted;
  }
}

function applyClientFilters(creators: Creator[], filters: CreatorSearchFilters): Creator[] {
  let result = creators;

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.username.toLowerCase().includes(query) ||
        c.displayName.toLowerCase().includes(query) ||
        (c.bio && c.bio.toLowerCase().includes(query))
    );
  }

  if (filters.minEarnings !== '') {
    const min = parseFloat(filters.minEarnings);
    if (!Number.isNaN(min)) result = result.filter((c) => c.totalEarnings >= min);
  }

  if (filters.maxEarnings !== '') {
    const max = parseFloat(filters.maxEarnings);
    if (!Number.isNaN(max)) result = result.filter((c) => c.totalEarnings <= max);
  }

  return sortCreators(result, filters.sort);
}

export function useCreatorInfiniteScroll(): {
  filters: CreatorSearchFilters;
  setFilter: <K extends keyof CreatorSearchFilters>(
    key: K,
    value: CreatorSearchFilters[K]
  ) => void;
  resetFilters: () => void;
  creators: Creator[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sdk = useSDKClient();

  const [filters, setFilters] = useState<CreatorSearchFilters>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce the search text so we don't refetch on every keystroke
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [filters.search]);

  // Sync filter state to the URL so searches are shareable
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.verifiedOnly) params.set('verified', 'true');
      if (filters.minEarnings) params.set('minEarnings', filters.minEarnings);
      if (filters.maxEarnings) params.set('maxEarnings', filters.maxEarnings);
      if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);

      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['creatorsInfinite', filters.verifiedOnly],
    queryFn: ({ pageParam }) =>
      sdk.listCreators({
        page: pageParam,
        pageSize: PAGE_SIZE,
        ...(filters.verifiedOnly ? { verified: true } : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const total = lastPage?.total || 0;
      const hasMore = (lastPageParam * PAGE_SIZE) < total;
      return hasMore ? lastPageParam + 1 : undefined;
    },
  });

  // Flatten pages and extract creators
  const rawCreators: Creator[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => (page?.data || page?.creators || []) as Creator[]);
  }, [data]);

  // Apply client-side filters (search, earnings range, sorting)
  const creators = useMemo(
    () => applyClientFilters(rawCreators, { ...filters, search: debouncedSearch }),
    [rawCreators, filters, debouncedSearch]
  );

  const setFilter = useCallback(
    <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch('');
  }, []);

  return {
    filters,
    setFilter,
    resetFilters,
    creators,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage: isFetchingNextPage ?? false,
    isLoading: isLoading && creators.length === 0,
    error: error as Error | null,
    fetchNextPage: () => {
      void fetchNextPage();
    },
  };
}
