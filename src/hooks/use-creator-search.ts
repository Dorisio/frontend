/**
 * useCreatorSearch Hook
 * Debounced search, filtering, sorting, and pagination over the creator
 * discovery list, with filter state synced to URL params for shareable
 * searches.
 *
 * Note: the underlying SDK (dorisio-sdk) only supports `page`, `pageSize`,
 * and `verified` server-side. There is no server-side search, category, or
 * earnings-range filter, and creators have no `category` field at all. Text
 * search, earnings-range filtering, and sorting are therefore applied
 * client-side over the fetched page; only pagination and the verified filter
 * are true server-side round trips.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useSDKClient } from '@/lib/sdk-client';
import type { Creator } from '@/types';

export type CreatorSortOption = 'trending' | 'newest' | 'alphabetical' | 'earnings';

export interface CreatorSearchFilters {
  search: string;
  verifiedOnly: boolean;
  minEarnings: string;
  maxEarnings: string;
  sort: CreatorSortOption;
  page: number;
}

const DEFAULT_FILTERS: CreatorSearchFilters = {
  search: '',
  verifiedOnly: false,
  minEarnings: '',
  maxEarnings: '',
  sort: 'trending',
  page: 1,
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
    page: Number(params.get('page')) || DEFAULT_FILTERS.page,
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
      // No dedicated "trending" signal exists on the Creator model; earnings
      // is used as the closest available proxy for both options.
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

export function useCreatorSearch(): {
  filters: CreatorSearchFilters;
  setFilter: <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => void;
  resetFilters: () => void;
  creators: Creator[];
  total: number;
  pageSize: number;
  isLoading: boolean;
  error: Error | null;
} {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sdk = useSDKClient();

  const [filters, setFilters] = useState<CreatorSearchFilters>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // Debounce the search text so we don't refetch/refilter on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [filters.search]);

  // Sync filter state to the URL so searches are shareable.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.verifiedOnly) params.set('verified', 'true');
      if (filters.minEarnings) params.set('minEarnings', filters.minEarnings);
      if (filters.maxEarnings) params.set('maxEarnings', filters.maxEarnings);
      if (filters.sort !== DEFAULT_FILTERS.sort) params.set('sort', filters.sort);
      if (filters.page !== DEFAULT_FILTERS.page) params.set('page', String(filters.page));

      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['creators', filters.page, PAGE_SIZE, filters.verifiedOnly],
    queryFn: () =>
      sdk.listCreators({
        page: filters.page,
        pageSize: PAGE_SIZE,
        ...(filters.verifiedOnly ? { verified: true } : {}),
      }),
  });

  const rawCreators: Creator[] = useMemo(
    () => (data?.data || data?.creators || []) as Creator[],
    [data]
  );

  const creators = useMemo(
    () => applyClientFilters(rawCreators, { ...filters, search: debouncedSearch }),
    [rawCreators, filters, debouncedSearch]
  );

  const setFilter = useCallback(
    <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        // Any filter change other than paging itself resets to page 1.
        page: key === 'page' ? (value as number) : 1,
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
    total: data?.total || 0,
    pageSize: PAGE_SIZE,
    isLoading,
    error: error as Error | null,
  };
}
