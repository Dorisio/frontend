/**
 * Tip Source Breakdown
 * Pie chart of tip earnings by source/category, for the creator analytics dashboard.
 */

'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TipSourceBreakdownEntry } from '@/types';
import { formatCurrency } from '@/utils/formatters';

export interface TipSourceBreakdownProps {
  data: TipSourceBreakdownEntry[];
}

// Fixed categorical order drawn from the app's existing design tokens
// (tailwind.config.ts), so a source always maps to the same color rather
// than shifting when the list is filtered or reordered.
const SOURCE_COLORS = ['#ffbf1f', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#14b8a6'];

export function TipSourceBreakdown({ data }: TipSourceBreakdownProps): JSX.Element {
  const total = data.reduce((sum, entry) => sum + entry.amount, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
        No tips for this period
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-80" data-testid="tip-source-breakdown-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="source"
            cx="50%"
            cy="50%"
            innerRadius="45%"
            outerRadius="75%"
            paddingAngle={2}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell key={entry.source} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 8,
              color: '#ffffff',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: '#888888' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
