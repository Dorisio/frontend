/**
 * Live Tips Notifications Component
 * Displays real-time tip notifications in a toast-like container
 */

'use client';

import { useEffect } from 'react';
import { useRealtimeTips } from '@/hooks/use-realtime-tips';
import { formatCurrency } from '@/utils/formatters';
import { X, Zap } from 'lucide-react';

export interface LiveTipsNotificationsProps {
  creatorId?: string;
  pollingInterval?: number;
  enableWebSocket?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoHideDuration?: number;
}

export function LiveTipsNotifications({
  creatorId,
  pollingInterval = 5000,
  enableWebSocket = false,
  position = 'bottom-right',
  maxNotifications = 5,
  autoHideDuration = 4000,
}: LiveTipsNotificationsProps) {
  const { tips, isConnected, error, dismissTip } = useRealtimeTips({
    creatorId,
    pollingInterval,
    enableWebSocket,
  });

  // Auto-hide notifications
  useEffect(() => {
    const timers = tips
      .filter((tip) => tip.isNew)
      .map((tip) =>
        setTimeout(() => {
          dismissTip(tip.id);
        }, autoHideDuration)
      );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [tips, autoHideDuration, dismissTip]);

  const visibleTips = tips.slice(0, maxNotifications);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none space-y-2`}>
      {/* Connection status */}
      {enableWebSocket && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1 bg-background/80 rounded border">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {isConnected ? 'Live' : 'Connecting...'}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm pointer-events-auto">
          {error}
        </div>
      )}

      {/* Notifications */}
      {visibleTips.map((tip) => (
        <div
          key={tip.id}
          className={`pointer-events-auto bg-background border rounded-lg shadow-lg p-4 max-w-xs animate-in slide-in-from-right-full duration-300 ${
            tip.isNew ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                <Zap className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{formatCurrency(tip.amount)}</p>
                {tip.message && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    "{tip.message}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(tip.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => dismissTip(tip.id)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded transition"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
