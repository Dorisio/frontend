/**
 * Live Metrics Cards
 * Display real-time analytics: tip rate, velocity, and performance indicators
 */

'use client';

import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import type { LiveMetrics } from '@/hooks/use-live-analytics';

export interface LiveMetricsCardsProps {
  metrics: LiveMetrics;
}

export function LiveMetricsCards({ metrics }: LiveMetricsCardsProps): JSX.Element {
  const velocityIcon =
    metrics.velocityTrend === 'up' ? (
      <TrendingUp className="w-5 h-5 text-green-600" />
    ) : metrics.velocityTrend === 'down' ? (
      <TrendingDown className="w-5 h-5 text-red-600" />
    ) : (
      <Zap className="w-5 h-5 text-muted-foreground" />
    );

  const velocityLabel =
    metrics.velocityTrend === 'up'
      ? 'Increasing'
      : metrics.velocityTrend === 'down'
        ? 'Decreasing'
        : 'Stable';

  const velocityColor =
    metrics.velocityTrend === 'up'
      ? 'text-green-600'
      : metrics.velocityTrend === 'down'
        ? 'text-red-600'
        : 'text-muted-foreground';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tip Rate (per minute) */}
      <div className="bg-background border rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Tips This Minute</h3>
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <p className="text-3xl font-bold">{metrics.tipRatePerMinute}</p>
        <p className="text-xs text-muted-foreground">Real-time tip count</p>
      </div>

      {/* Tips This Hour */}
      <div className="bg-background border rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Tips This Hour</h3>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <p className="text-3xl font-bold">{metrics.tipRatePerHour}</p>
        <p className="text-xs text-muted-foreground">Hourly performance</p>
      </div>

      {/* Velocity Trend */}
      <div className="bg-background border rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Velocity</h3>
          {velocityIcon}
        </div>
        <p className={`text-2xl font-bold ${velocityColor}`}>{velocityLabel}</p>
        <p className="text-xs text-muted-foreground">Trend direction</p>
      </div>
    </div>
  );
}
