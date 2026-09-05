/**
 * Creator Profile Page
 * Public profile page for a creator at /creators/[username]
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Creator } from '@/types';
import { useCreatorBalance } from '@/hooks/use-creator-balance';
import { useTransactionHistory } from '@/hooks/use-transaction-history';
import { useDorisio } from 'dorisio-sdk/react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import DorisioButton from '@/components/sections/dorisio-button';

interface CreatorPageState {
  creator: Creator | null;
  loading: boolean;
  error: string | null;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { client } = useDorisio();

  const [state, setState] = useState<CreatorPageState>({
    creator: null,
    loading: true,
    error: null,
  });

  const balance = useCreatorBalance(state.creator?.id);
  const history = useTransactionHistory(state.creator?.id);

  // Fetch creator profile
  useEffect(() => {
    async function fetchCreator() {
      try {
        const creator = await client.getCreatorProfile(username);
        setState({ creator: creator as Creator, loading: false, error: null });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to load creator profile';
        setState({ creator: null, loading: false, error });
      }
    }

    if (username) {
      fetchCreator();
    }
  }, [username, client]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.creator) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Creator Not Found</h1>
          <p className="text-muted-foreground mb-4">{state.error || 'This creator does not exist.'}</p>
          <a href="/creators" className="text-primary hover:underline">
            Browse all creators
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex gap-8 items-start">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {state.creator.avatar ? (
                <img
                  src={state.creator.avatar}
                  alt={state.creator.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary">
                  <span className="text-3xl font-bold text-primary">
                    {state.creator.displayName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{state.creator.displayName}</h1>
                {state.creator.verified && (
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mb-4">@{state.creator.username}</p>

              {state.creator.bio && (
                <p className="text-lg mb-6 max-w-2xl">{state.creator.bio}</p>
              )}

              <div className="flex gap-8 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatCurrency(state.creator.totalEarnings)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{formatCurrency(state.creator.pendingBalance)}</p>
                </div>
              </div>

              {/* Tip Button */}
              <DorisioButton creatorId={state.creator.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Earnings Overview */}
        {balance.balance && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-6">Earnings Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-6 bg-card">
                <p className="text-sm text-muted-foreground mb-2">Total Earnings</p>
                <p className="text-3xl font-bold">{formatCurrency(balance.balance.totalEarnings)}</p>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(balance.balance.availableBalance || 0)}
                </p>
              </div>
              <div className="border rounded-lg p-6 bg-card">
                <p className="text-sm text-muted-foreground mb-2">Pending</p>
                <p className="text-3xl font-bold">{formatCurrency(balance.balance.pendingBalance)}</p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Tips */}
        {history.transactions.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6">Recent Tips</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">From</th>
                    <th className="text-left px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Message</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-muted/50 transition">
                      <td className="px-6 py-4 text-sm">Anonymous</td>
                      <td className="px-6 py-4 font-semibold">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {tx.message || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDate(tx.createdAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                          tx.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : tx.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {history.total > history.pageSize && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  onClick={() => history.prevPage()}
                  disabled={history.page === 1 || history.loading}
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {history.page} of {Math.ceil(history.total / history.pageSize)}
                </span>
                <button
                  onClick={() => history.nextPage()}
                  disabled={
                    history.page >= Math.ceil(history.total / history.pageSize) ||
                    history.loading
                  }
                  className="px-4 py-2 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {history.transactions.length === 0 && !history.loading && (
          <section className="text-center py-12">
            <p className="text-muted-foreground mb-4">No tips yet</p>
            <p className="text-sm text-muted-foreground">Be the first to support this creator!</p>
          </section>
        )}
      </div>
    </main>
  );
}
