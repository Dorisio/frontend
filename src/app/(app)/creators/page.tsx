/**
 * Creator Discovery Page
 * Browse and search creators with infinite scroll
 */

'use client';

import { Suspense } from 'react';
import { useCreatorInfiniteScroll } from '@/hooks/use-creator-infinite-scroll';
import { CreatorSearchBar } from '@/components/sections/creator-search-bar';
import { CreatorInfiniteScroll } from '@/components/sections/creator-infinite-scroll';

export default function CreatorDiscoveryPage() {
  return (
    <Suspense fallback={null}>
      <CreatorDiscoveryPageContent />
    </Suspense>
  );
}

function CreatorDiscoveryPageContent() {
  const {
    filters,
    setFilter,
    resetFilters,
    creators,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    fetchNextPage,
  } = useCreatorInfiniteScroll();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">Discover Creators</h1>
          <p className="text-xl text-muted-foreground">Support your favorite creators with tips</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <CreatorSearchBar filters={filters} onChange={setFilter} onReset={resetFilters} />

        {/* Results Count */}
        {creators.length > 0 && (
          <p className="text-muted-foreground mb-6">
            Showing {creators.length} creator{creators.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
            <p className="font-medium">{error.message || 'Failed to load creators'}</p>
          </div>
        )}

        {/* Infinite Scroll Container */}
        <CreatorInfiniteScroll
          creators={creators}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          onLoadMore={fetchNextPage}
        />
      </div>
    </main>
  );
}
