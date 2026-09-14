/**
 * Embeddable Tip Widget Page
 * Standalone page meant to be iframed into third-party sites
 * Allows viewers to tip creators without leaving the embedded experience
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Creator } from '@/types';
import { useDorisio } from 'dorisio-sdk/react';
import { formatCurrency } from '@/utils/formatters';
import DorisioButton from '@/components/sections/dorisio-button';

interface EmbedWidgetState {
  creator: Creator | null;
  loading: boolean;
  error: string | null;
}

export default function EmbedTipWidget(): JSX.Element {
  const params = useParams();
  const username = params.username as string;
  const { client } = useDorisio();

  const [state, setState] = useState<EmbedWidgetState>({
    creator: null,
    loading: true,
    error: null,
  });

  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState('5');

  // Fetch creator profile
  useEffect(() => {
    async function fetchCreator(): Promise<void> {
      try {
        const creator = await client.getCreatorProfile(username);
        setState({ creator: creator as Creator, loading: false, error: null });
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Failed to load creator';
        setState({ creator: null, loading: false, error });
      }
    }

    if (username) {
      fetchCreator();
    }
  }, [username, client]);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading creator...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.creator) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center max-w-sm mx-auto px-4">
          <h1 className="text-lg font-bold mb-2">Creator Not Found</h1>
          <p className="text-sm text-muted-foreground">
            {state.error || 'This creator does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {state.creator.avatar ? (
                <img
                  src={state.creator.avatar}
                  alt={state.creator.displayName}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {state.creator.displayName?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{state.creator.displayName}</p>
                <p className="text-xs text-muted-foreground">@{state.creator.username}</p>
              </div>
            </div>
            <a
              href={`https://dorisio.io/creators/${state.creator.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex-shrink-0"
            >
              View Full
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Creator Info */}
          <div className="bg-background rounded-lg p-4 mb-4 border">
            <h2 className="font-semibold mb-2">{state.creator.displayName}</h2>
            {state.creator.bio && (
              <p className="text-sm text-muted-foreground line-clamp-3">{state.creator.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="font-bold text-sm">{formatCurrency(state.creator.totalEarnings)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tips Received</p>
                <p className="font-bold text-sm">{state.creator.totalEarnings > 0 ? '✓' : '-'}</p>
              </div>
            </div>
          </div>

          {/* Quick Tip Amounts */}
          <div className="bg-background rounded-lg p-4 border mb-4">
            <p className="text-sm font-medium mb-3">Quick Tip</p>
            <div className="grid grid-cols-4 gap-2">
              {['1', '5', '10', '25'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTipAmount(amount)}
                  className={`py-2 px-1 rounded text-xs font-medium transition ${
                    tipAmount === amount
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Message (optional) */}
          <div className="bg-background rounded-lg p-4 border">
            <p className="text-sm font-medium mb-2">Message (optional)</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Send a message with your tip..."
              maxLength={200}
              className="w-full text-xs p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">{message.length}/200</p>
          </div>
        </div>

        {/* Footer - Action Button */}
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 space-y-2">
          <DorisioButton creatorId={state.creator.id} className="w-full" />
          <p className="text-xs text-center text-muted-foreground">
            Powered by{' '}
            <a
              href="https://dorisio.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Dorisio
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
