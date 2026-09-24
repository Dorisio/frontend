/**
 * Earnings Trend Chart
 * Line chart of daily earnings over a date range, for the creator analytics dashboard.
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { EarningsTrendPoint } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

export interface EarningsTrendChartProps {
  data: EarningsTrendPoint[];
}

export function EarningsTrendChart({ data }: EarningsTrendChartProps): JSX.Element {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No earnings data for this period
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-80" data-testid="earnings-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDate(value)}
            tick={{ fontSize: 12, fill: '#888888' }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => formatCurrency(value)}
            tick={{ fontSize: 12, fill: '#888888' }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'Earnings']}
            labelFormatter={(label) => (label ? formatDate(String(label)) : '')}
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#ffbf1f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
