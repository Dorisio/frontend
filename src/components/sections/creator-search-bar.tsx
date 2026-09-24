/**
 * Creator Search Bar
 * Debounced search input plus verified/earnings filters and sort control
 * for the creator discovery page.
 */

'use client';

import type { CreatorSearchFilters, CreatorSortOption } from '@/hooks/use-creator-search';

export interface CreatorSearchBarProps {
  filters: CreatorSearchFilters;
  onChange: <K extends keyof CreatorSearchFilters>(key: K, value: CreatorSearchFilters[K]) => void;
  onReset: () => void;
}

export function CreatorSearchBar({ filters, onChange, onReset }: CreatorSearchBarProps): JSX.Element {
  return (
    <div className="space-y-4 mb-8">
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search creators..."
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search creators"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => onChange('verifiedOnly', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Verified only</span>
        </label>
      </div>

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
            className="block mt-1 px-2 py-1.5 border rounded text-sm w-32"
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
            className="block mt-1 px-2 py-1.5 border rounded text-sm w-32"
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
            className="block mt-1 px-2 py-1.5 border rounded text-sm"
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
