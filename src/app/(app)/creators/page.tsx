/**
 * Creator Discovery Page
 * Browse and search creators
 */

'use client';

import { Suspense } from 'react';
import { useCreatorSearch } from '@/hooks/use-creator-search';
import { formatCurrency } from '@/utils/formatters';
import { CreatorSearchBar } from '@/components/sections/creator-search-bar';
import DorisioButton from '@/components/sections/dorisio-button';
import Link from 'next/link';

export default function CreatorDiscoveryPage() {
  return (
    <Suspense fallback={null}>
      <CreatorDiscoveryPageContent />
    </Suspense>
  );
}

function CreatorDiscoveryPageContent() {
  const { filters, setFilter, resetFilters, creators, total, pageSize, isLoading, error } =
    useCreatorSearch();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

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
        <p className="text-muted-foreground mb-6">
          Found {creators.length} creator{creators.length !== 1 ? 's' : ''}
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <p className="font-medium">{error.message || 'Failed to load creators'}</p>
          </div>
        )}

        {/* Creators Grid */}
        {!isLoading && !error && creators.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Link key={creator.id} href={`/creators/${creator.username}`}>
                <div className="border rounded-lg overflow-hidden hover:shadow-lg transition h-full bg-card">
                  {/* Card Header */}
                  <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20"></div>

                  {/* Card Content */}
                  <div className="p-6 -mt-8 relative">
                    {/* Avatar */}
                    <div className="mb-4">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-16 h-16 rounded-full object-cover border-4 border-background"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background">
                          <span className="text-xl font-bold text-primary">
                            {creator.displayName?.charAt(0) || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name and Verification */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{creator.displayName}</h3>
                        {creator.verified && <span className="text-green-600">✓</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">@{creator.username}</p>
                    </div>

                    {/* Bio */}
                    {creator.bio && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {creator.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="bg-muted rounded-lg p-3 mb-4 text-sm">
                      <p className="text-muted-foreground">Total Earnings</p>
                      <p className="font-bold">{formatCurrency(creator.totalEarnings)}</p>
                    </div>

                    {/* Tip Button */}
                    <DorisioButton
                      creatorId={creator.id}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && creators.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setFilter('page', Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted transition"
            >
              ← Prev
            </button>
            <span className="text-sm text-muted-foreground px-2">
              Page {filters.page} of {totalPages}
            </span>
            <button
              onClick={() => setFilter('page', Math.min(totalPages, filters.page + 1))}
              disabled={filters.page >= totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && creators.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No creators found</p>
            <button onClick={resetFilters} className="text-primary hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
