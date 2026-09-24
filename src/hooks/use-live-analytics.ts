/**
 * useLiveAnalytics Hook
 * Subscribes to real-time analytics updates via WebSocket and computes
 * live metrics like tip rate, velocity, and performance benchmarking.
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeNotifications } from './use-realtime-notifications';
import type { TipNotification } from './use-realtime-notifications';

export interface LiveMetrics {
  tipRatePerMinute: number;
  tipRatePerHour: number;
  velocityTrend: 'up' | 'down' | 'stable';
  recentTipsCount: number;
  lastTipAt?: string;
}

interface TipWindow {
  timestamp: number;
  amount: number;
}

const METRICS_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for metrics

export function useLiveAnalytics(creatorId: string | null | undefined): LiveMetrics {
  const { notifications } = useRealtimeNotifications(creatorId);
  const tipsWindowRef = useRef<TipWindow[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics>({
    tipRatePerMinute: 0,
    tipRatePerHour: 0,
    velocityTrend: 'stable',
    recentTipsCount: 0,
  });

  useEffect(() => {
    if (!notifications.length) return;

    // Add new tips to the window
    const now = Date.now();
    const newTips: TipWindow[] = notifications.map((tip) => ({
      timestamp: new Date(tip.createdAt).getTime(),
      amount: tip.amount,
    }));

    tipsWindowRef.current = [...tipsWindowRef.current, ...newTips];

    // Remove tips older than the window
    tipsWindowRef.current = tipsWindowRef.current.filter(
      (tip) => now - tip.timestamp < METRICS_WINDOW_MS
    );

    // Calculate metrics
    const recentWindow = tipsWindowRef.current.filter((tip) => now - tip.timestamp < 60 * 1000); // Last minute
    const olderWindow = tipsWindowRef.current.filter(
      (tip) => now - tip.timestamp >= 60 * 1000 && now - tip.timestamp < 10 * 60 * 1000 // 1-10 minutes ago
    );

    const tipRatePerMinute = recentWindow.length;
    const tipRatePerHour = tipsWindowRef.current.length;

    // Determine velocity trend
    let velocityTrend: 'up' | 'down' | 'stable' = 'stable';
    if (olderWindow.length > 0) {
      const recentAvg = recentWindow.length / 1;
      const olderAvg = olderWindow.length / 9;
      if (recentAvg > olderAvg * 1.2) {
        velocityTrend = 'up';
      } else if (recentAvg < olderAvg * 0.8) {
        velocityTrend = 'down';
      }
    }

    const lastTip = tipsWindowRef.current[tipsWindowRef.current.length - 1];

    setMetrics({
      tipRatePerMinute,
      tipRatePerHour,
      velocityTrend,
      recentTipsCount: recentWindow.length,
      lastTipAt: lastTip ? new Date(lastTip.timestamp).toISOString() : undefined,
    });
  }, [notifications]);

  return metrics;
}
