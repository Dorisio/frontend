/**
 * Message Search Bar
 * Allows creators to search and filter tip messages
 */

'use client';

import { Search, X } from 'lucide-react';
import { useMessageSearchStore } from '@/stores/message-search-store';

export interface MessageSearchBarProps {
  resultCount?: number;
}

export function MessageSearchBar({ resultCount }: MessageSearchBarProps): JSX.Element {
  const { searchQuery, setSearchQuery, clearSearch } = useMessageSearchStore();

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search messages by keyword or tipper..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-dark pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-body transition"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {resultCount !== undefined && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
