/**
 * Creator Discovery Page
 * Browse and search creators
 */

'use client';

import { useState, useEffect } from 'react';
import { useSDKClient } from '@/lib/sdk-client';
import { Creator } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import DorisioButton from '@/components/sections/dorisio-button';
import Link from 'next/link';

interface DiscoveryState {
  creators: Creator[];
  filteredCreators: Creator[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filterVerified: boolean;
}

export default function CreatorDiscoveryPage() {
  const sdk = useSDKClient();
  const [state, setState] = useState<DiscoveryState>({
    creators: [],
    filteredCreators: [],
    loading: true,
    error: null,
    searchQuery: '',
    filterVerified: false,
  });

  // Fetch creators
  useEffect(() => {
    async function fetchCreators() {
      try {
        const result = await sdk.listCreators({
          page: 1,
          pageSize: 50,
          isPublic: true,
        });

        const creators = (result.data || result.creators || []) as Creator[];
        setState((s) => ({
          ...s,
          creators,
          filteredCreators: creators,
          loading: false,
          error: null,
        }));
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to load creators';
        setState((s) => ({ ...s, error, loading: false }));
      }
    }

    fetchCreators();
  }, [sdk]);

  // Handle search and filtering
  useEffect(() => {
    let filtered = state.creators;

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.username.toLowerCase().includes(query) ||
          c.displayName.toLowerCase().includes(query) ||
          (c.bio && c.bio.toLowerCase().includes(query))
      );
    }

    // Verified filter
    if (state.filterVerified) {
      filtered = filtered.filter((c) => c.verified);
    }

    setState((s) => ({ ...s, filteredCreators: filtered }));
  }, [state.searchQuery, state.filterVerified, state.creators]);

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
        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search creators..."
              value={state.searchQuery}
              onChange={(e) =>
                setState((s) => ({ ...s, searchQuery: e.target.value }))
              }
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-muted transition">
            <input
              type="checkbox"
              checked={state.filterVerified}
              onChange={(e) =>
                setState((s) => ({ ...s, filterVerified: e.target.checked }))
              }
              className="w-4 h-4"
            />
            <span className="text-sm">Verified only</span>
          </label>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6">
          Found {state.filteredCreators.length} creator{state.filteredCreators.length !== 1 ? 's' : ''}
        </p>

        {/* Loading State */}
        {state.loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading creators...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            <p className="font-medium">{state.error}</p>
          </div>
        )}

        {/* Creators Grid */}
        {!state.loading && state.filteredCreators.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.filteredCreators.map((creator) => (
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
                        {creator.verified && (
                          <span className="text-green-600">✓</span>
                        )}
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

        {/* No Results */}
        {!state.loading && state.filteredCreators.length === 0 && !state.error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No creators found</p>
            <button
              onClick={() => setState((s) => ({ ...s, searchQuery: '', filterVerified: false }))}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
