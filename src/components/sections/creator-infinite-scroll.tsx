/**
 * Creator Infinite Scroll Container
 * Renders creators in an infinite scroll feed with intersection observer
 * for lazy-loading the next page when user scrolls near the bottom.
 */

'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/utils/formatters';
import { Skeleton } from '@/components/shared/skeleton';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Creator } from '@/types';
import DorisioButton from './dorisio-button';

export interface CreatorInfiniteScrollProps {
  creators: Creator[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
}

export function CreatorInfiniteScroll({
  creators,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
}: CreatorInfiniteScrollProps): JSX.Element {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Intersection Observer to detect when user scrolls near the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  return (
    <div className="space-y-4">
      {/* Creators Grid */}
      {creators.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <Link key={creator.id} href={`/creators/${creator.username}`}>
              <div className="border rounded-lg overflow-hidden hover:shadow-lg transition h-full bg-card">
                {/* Card Header */}
                <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />

                {/* Card Content */}
                <div className="p-6 -mt-8 relative">
                  {/* Avatar */}
                  <div className="mb-4">
                    {creator.avatar ? (
                      <img
                        src={creator.avatar}
                        alt={creator.displayName}
                        className="w-16 h-16 rounded-full object-cover border-4 border-background"
                        loading="lazy"
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
                      {creator.verified && (
                        <span className="text-green-600" title="Verified">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{creator.username}</p>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{creator.bio}</p>
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

      {/* Loading skeleton for initial load */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden bg-card">
              <Skeleton className="h-24 w-full" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-12 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && creators.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No creators found</p>
        </div>
      )}

      {/* Scroll target for intersection observer */}
      <div ref={observerTarget} className="py-4" />

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="py-8 flex justify-center">
          <LoadingSpinner size="md" message="Loading more creators..." />
        </div>
      )}
    </div>
  );
}
