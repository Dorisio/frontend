/**
 * Live Activity Feed
 * Real-time activity stream showing recent tips as they arrive
 */

'use client';

import { Gift, User } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/utils/formatters';
import type { TipNotification } from '@/hooks/use-realtime-notifications';

export interface LiveActivityFeedProps {
  notifications: TipNotification[];
  maxItems?: number;
}

export function LiveActivityFeed({
  notifications,
  maxItems = 10,
}: LiveActivityFeedProps): JSX.Element {
  const recentActivity = notifications.slice(0, maxItems);

  return (
    <div className="bg-background border rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        Live Activity
      </h2>

      {recentActivity.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recentActivity.map((tip, index) => (
            <div
              key={`${tip.id}-${index}`}
              className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-muted hover:bg-muted/50 transition"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {tip.tipperName || 'Anonymous tipper'}
                    </p>
                    {tip.message && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        "{tip.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(tip.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(tip.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
