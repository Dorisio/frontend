/**
 * Creator Spotlight Section
 * Featured creators showcase - wired to real SDK data
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Creator } from '@/types';
import { useSDKClient } from '@/lib/sdk-client';
import { formatCurrency } from '@/utils/formatters';
import DorisioButton from './dorisio-button';

export function CreatorSpotlightSection(): JSX.Element {
  const sdk = useSDKClient();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpotlightCreators() {
      try {
        setLoading(true);
        const result = await sdk.listCreators({
          page: 1,
          pageSize: 4,
          isPublic: true,
          featured: true,
        });

        const data = (result.data || result.creators || []) as Creator[];
        setCreators(data.slice(0, 4));
      } catch (err) {
        console.warn('Failed to fetch spotlight creators:', err);
        setCreators([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSpotlightCreators();
  }, [sdk]);

  const displayCreators = creators.length > 0 ? creators : getDefaultCreators();

  return (
    <section id="creators" className="py-20 md:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold">Featured Creators</h2>
          <p className="text-lg text-muted-foreground">
            Support amazing creators building great content
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Creators Grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayCreators.map((creator) => (
              <Link key={creator.id} href={`/creators/${creator.username}`}>
                <div className="group rounded-lg border bg-background hover:border-primary hover:shadow-lg transition h-full flex flex-col">
                  {/* Header */}
                  <div className="h-16 bg-gradient-to-r from-primary/20 to-secondary/20"></div>

                  {/* Content */}
                  <div className="p-6 -mt-4 flex-1 flex flex-col">
                    {/* Avatar */}
                    <div className="mb-4">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar}
                          alt={creator.displayName}
                          className="w-12 h-12 rounded-full object-cover border-4 border-background"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border-4 border-background text-sm font-bold">
                          {creator.displayName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>

                    {/* Name & Info */}
                    <h3 className="font-semibold group-hover:text-primary transition mb-1">
                      {creator.displayName}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">@{creator.username}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {creator.bio || 'Creator on Dorisio'}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 py-3 border-t border-muted mb-4">
                      <div>
                        <p className="font-bold text-primary">
                          {formatCurrency(creator.totalEarnings)}
                        </p>
                        <p className="text-xs text-muted-foreground">Earnings</p>
                      </div>
                      <div>
                        {creator.verified && <p className="font-bold text-green-600">✓ Verified</p>}
                      </div>
                    </div>

                    {/* CTA */}
                    <div onClick={(e) => e.preventDefault()}>
                      <DorisioButton
                        creatorId={creator.id}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center pt-8">
          <Link
            href="/creators"
            className="inline-block px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition font-semibold"
          >
            Explore All Creators →
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Default creators for when backend is not available
 */
function getDefaultCreators(): Creator[] {
  return [
    {
      id: '1',
      userId: 'user1',
      username: 'musicproducer_alex',
      displayName: 'Alex Music Studio',
      bio: 'Electronic music producer & educator',
      avatar: undefined,
      verified: true,
      isPublic: true,
      totalEarnings: 1250,
      pendingBalance: 150,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user2',
      username: 'designstudio_pro',
      displayName: 'Creative Design Co',
      bio: 'UI/UX design tutorials and resources',
      avatar: undefined,
      verified: true,
      isPublic: true,
      totalEarnings: 980,
      pendingBalance: 120,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      userId: 'user3',
      username: 'tech_educator_sam',
      displayName: 'Sam Tech Academy',
      bio: 'Web development & programming courses',
      avatar: undefined,
      verified: true,
      isPublic: true,
      totalEarnings: 1450,
      pendingBalance: 200,
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      userId: 'user4',
      username: 'fitness_coach_maria',
      displayName: 'Maria Fitness Hub',
      bio: 'Fitness training and wellness coaching',
      avatar: undefined,
      verified: true,
      isPublic: true,
      totalEarnings: 750,
      pendingBalance: 100,
      createdAt: new Date().toISOString(),
    },
  ];
}
