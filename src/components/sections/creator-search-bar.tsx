/**
 * Creator Search Bar
 * Debounced search input with autocomplete suggestions, creator avatars,
 * search history, trending creators, keyboard navigation, and filter controls.
 */

'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { CreatorVerificationBadge } from '@/components/shared/creator-verification-badge';
import { formatCurrency } from '@/utils/formatters';
import type { CreatorSearchFilters, CreatorSortOption } from '@/hooks/use-creator-search';
import type { Creator } from '@/types';

export const RECENT_SEARCHES_KEY = 'dorisio_recent_searches';
export const MAX_RECENT_SEARCHES = 5;

export const DEFAULT_SAMPLE_CREATORS: Creator[] = [
  {
    id: 'creator-1',
    userId: 'user-1',
    username: 'alice',
    displayName: 'Alice Cooper',
    bio: 'Digital artist & illustrator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 2450.5,
    pendingBalance: 120,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'creator-2',
    userId: 'user-2',
    username: 'bob',
    displayName: 'Bob Builder',
    bio: 'Software engineer building web3 tools',
    avatar: '',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 1800,
    pendingBalance: 50,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'creator-3',
    userId: 'user-3',
    username: 'charlie',
    displayName: 'Charlie Parker',
    bio: 'Jazz musician and educator',
    avatar: '',
    verified: false,
    isPublic: true,
    totalEarnings: 950,
    pendingBalance: 0,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'creator-4',
    userId: 'user-4',
    username: 'david',
    displayName: 'David Miller',
    bio: 'Tech journalist and podcaster',
    avatar: '',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 3200,
    pendingBalance: 200,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'creator-5',
    userId: 'user-5',
    username: 'emma',
    displayName: 'Emma Watson',
    bio: 'Photographer traveling the world',
    avatar: '',
    verified: true,
    verificationStatus: 'verified',
    isPublic: true,
    totalEarnings: 1540,
    pendingBalance: 80,
    createdAt: '2026-02-15T00:00:00.000Z',
  },
];
export const DEFAULT_TRENDING_CREATORS = DEFAULT_SAMPLE_CREATORS;

export interface CreatorSearchBarProps {
  filters: CreatorSearchFilters;
  onChange: <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => void;
  onReset: () => void;
  creators?: Creator[];
  trendingCreators?: Creator[];
  onSelectCreator?: (creator: Creator) => void;
}

type NavigableItem =
  | { type: 'history'; term: string }
  | { type: 'suggestion'; creator: Creator }
  | { type: 'trending'; creator: Creator };

export function CreatorSearchBar({
  filters,
  onChange,
  onReset,
  creators,
  trendingCreators,
  onSelectCreator,
}: CreatorSearchBarProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search value by 300ms for suggestions
  const debouncedSearch = useDebounce(filters.search, 300);

  // Read search history from localStorage on mount and when dropdown opens
  const loadRecentSearches = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  const saveSearchTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const existing: string[] = stored ? JSON.parse(stored) : [];
      const updated = [
        trimmed,
        ...existing.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES);

      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const removeSearchTerm = useCallback((termToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const existing: string[] = stored ? JSON.parse(stored) : [];
      const updated = existing.filter((item) => item.toLowerCase() !== termToRemove.toLowerCase());
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearAllRecentSearches = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Source list of creators for suggestions
  const creatorsPool = useMemo(() => {
    if (creators && creators.length > 0) return creators;
    return DEFAULT_SAMPLE_CREATORS;
  }, [creators]);

  // Trending creators
  const activeTrendingCreators = useMemo(() => {
    if (trendingCreators && trendingCreators.length > 0) return trendingCreators;
    return [...creatorsPool].sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 4);
  }, [trendingCreators, creatorsPool]);

  // Filtered suggestions based on debounced search
  const suggestions = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return [];

    return creatorsPool
      .filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) ||
          c.username.toLowerCase().includes(query) ||
          (c.bio && c.bio.toLowerCase().includes(query))
      )
      .slice(0, 6);
  }, [debouncedSearch, creatorsPool]);

  const hasQuery = debouncedSearch.trim().length > 0;

  // Flatten currently visible items for keyboard navigation
  const navigableItems: NavigableItem[] = useMemo(() => {
    if (hasQuery) {
      return suggestions.map((creator) => ({ type: 'suggestion', creator }));
    }

    const items: NavigableItem[] = [];
    recentSearches.forEach((term) => items.push({ type: 'history', term }));
    activeTrendingCreators.forEach((creator) => items.push({ type: 'trending', creator }));
    return items;
  }, [hasQuery, suggestions, recentSearches, activeTrendingCreators]);

  // Reset highlight on query change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [debouncedSearch, isOpen]);

  const handleSelectCreator = (creator: Creator) => {
    onChange('search', creator.displayName);
    saveSearchTerm(creator.displayName);
    onSelectCreator?.(creator);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSelectHistory = (term: string) => {
    onChange('search', term);
    saveSearchTerm(term);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        loadRecentSearches();
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (navigableItems.length === 0) return;
      setHighlightedIndex((prev) => (prev + 1 >= navigableItems.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (navigableItems.length === 0) return;
      setHighlightedIndex((prev) => (prev <= 0 ? navigableItems.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < navigableItems.length) {
        const item = navigableItems[highlightedIndex];
        if (item.type === 'history') {
          handleSelectHistory(item.term);
        } else {
          handleSelectCreator(item.creator);
        }
      } else if (filters.search.trim()) {
        saveSearchTerm(filters.search.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex gap-4">
        {/* Autocomplete Input Container */}
        <div ref={containerRef} className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search creators..."
              value={filters.search}
              onChange={(e) => {
                onChange('search', e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
                loadRecentSearches();
              }}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="creator-search-suggestions"
              aria-label="Search creators"
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>

          {/* Autocomplete Suggestions Dropdown (Mobile-Friendly) */}
          {isOpen && (
            <div
              id="creator-search-suggestions"
              role="listbox"
              data-testid="search-suggestions-dropdown"
              className="absolute left-0 right-0 top-full mt-1.5 w-full z-50 rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden max-h-80 sm:max-h-96 overflow-y-auto divide-y divide-border/60"
            >
              {hasQuery ? (
                /* Filtered suggestions matching debounced query */
                <div className="p-2">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Creators
                  </div>
                  {suggestions.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.map((creator, idx) => {
                        const isHighlighted = highlightedIndex === idx;
                        return (
                          <div
                            key={creator.id}
                            role="option"
                            aria-selected={isHighlighted}
                            data-testid={`suggestion-item-${creator.id}`}
                            onClick={() => handleSelectCreator(creator)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition min-h-[44px] ${
                              isHighlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                            }`}
                          >
                            {/* Creator Avatar with fallback */}
                            <div className="shrink-0">
                              {creator.avatar ? (
                                <img
                                  src={creator.avatar}
                                  alt={creator.displayName}
                                  className="w-10 h-10 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-border">
                                  {creator.displayName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>

                            {/* Name & Handle */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm truncate">
                                  {creator.displayName}
                                </span>
                                {creator.verified && (
                                  <CreatorVerificationBadge verified={creator.verified} compact />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                @{creator.username}
                              </p>
                            </div>

                            {/* Earnings preview */}
                            <div className="text-right shrink-0 hidden sm:block">
                              <span className="text-xs font-medium text-muted-foreground">
                                {formatCurrency(creator.totalEarnings)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="py-6 text-center text-sm text-muted-foreground"
                      data-testid="search-no-results"
                    >
                      <p>No creators found for &ldquo;{debouncedSearch}&rdquo;</p>
                      <p className="mt-1 text-xs">Check the spelling or try a different name.</p>
                      <button
                        type="button"
                        onClick={() => {
                          onChange('search', '');
                          inputRef.current?.focus();
                        }}
                        className="mt-3 text-primary hover:underline"
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Unfocused / Empty search: Show Search History & Trending Creators */
                <div className="divide-y divide-border/60">
                  {/* Search History Section */}
                  {recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center justify-between px-3 py-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <Clock className="h-3.5 w-3.5" />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecentSearches}
                          className="text-xs text-muted-foreground hover:text-foreground transition hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((term, idx) => {
                          const isHighlighted = highlightedIndex === idx;
                          return (
                            <div
                              key={term}
                              role="option"
                              aria-selected={isHighlighted}
                              data-testid={`history-item-${idx}`}
                              onClick={() => handleSelectHistory(term)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition min-h-[40px] ${
                                isHighlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate">{term}</span>
                              </div>
                              <button
                                type="button"
                                aria-label={`Remove ${term} from history`}
                                onClick={(e) => removeSearchTerm(term, e)}
                                className="text-muted-foreground hover:text-destructive p-1 rounded transition"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Trending Creators Section */}
                  <div className="p-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      Trending Creators
                    </div>
                    <div className="space-y-1">
                      {activeTrendingCreators.map((creator, tIdx) => {
                        const itemIdx = recentSearches.length + tIdx;
                        const isHighlighted = highlightedIndex === itemIdx;
                        return (
                          <div
                            key={creator.id}
                            role="option"
                            aria-selected={isHighlighted}
                            data-testid={`trending-item-${creator.id}`}
                            onClick={() => handleSelectCreator(creator)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition min-h-[44px] ${
                              isHighlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                            }`}
                          >
                            {/* Creator Avatar with fallback */}
                            <div className="shrink-0">
                              {creator.avatar ? (
                                <img
                                  src={creator.avatar}
                                  alt={creator.displayName}
                                  className="w-9 h-9 rounded-full object-cover border border-border"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-border">
                                  {creator.displayName?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                            </div>

                            {/* Name & Handle */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm truncate">
                                  {creator.displayName}
                                </span>
                                {creator.verified && (
                                  <CreatorVerificationBadge verified={creator.verified} compact />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                @{creator.username}
                              </p>
                            </div>

                            {/* Trending Earnings */}
                            <div className="text-right shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {formatCurrency(creator.totalEarnings)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Verified Only Checkbox */}
        <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition shrink-0">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange('verifiedOnly', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Verified only</span>
        </label>
      </div>

      {/* Filter Row: Min/Max Earnings, Sort, Reset */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="creator-min-earnings" className="text-xs font-medium text-muted-foreground">
            Min earnings
          </label>
          <input
            id="creator-min-earnings"
            type="number"
            min="0"
            step="0.01"
            value={filters.minEarnings}
            onChange={(e) => onChange('minEarnings', e.target.value)}
            placeholder="0"
            className="block mt-1 px-2 py-1.5 border rounded text-sm w-32 bg-background"
          />
        </div>
        <div>
          <label htmlFor="creator-max-earnings" className="text-xs font-medium text-muted-foreground">
            Max earnings
          </label>
          <input
            id="creator-max-earnings"
            type="number"
            min="0"
            step="0.01"
            value={filters.maxEarnings}
            onChange={(e) => onChange('maxEarnings', e.target.value)}
            placeholder="Any"
            className="block mt-1 px-2 py-1.5 border rounded text-sm w-32 bg-background"
          />
        </div>
        <div>
          <label htmlFor="creator-sort" className="text-xs font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="creator-sort"
            value={filters.sort}
            onChange={(e) => onChange('sort', e.target.value as CreatorSortOption)}
            className="block mt-1 px-2 py-1.5 border rounded text-sm bg-background"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="earnings">Earnings</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 text-sm border rounded hover:bg-muted transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
