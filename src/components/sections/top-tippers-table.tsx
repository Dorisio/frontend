/**
 * Top Tippers Table
 * Lists a creator's top supporters sorted by total tip amount.
 */

import type { TopTipper } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

export interface TopTippersTableProps {
  data: TopTipper[];
}

export function TopTippersTable({ data }: TopTippersTableProps): JSX.Element {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No tippers for this period
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalAmount - a.totalAmount);

  return (
    <div className="border rounded-lg overflow-x-auto" data-testid="top-tippers-table">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Rank</th>
            <th className="px-4 py-3 text-left font-semibold">Tipper</th>
            <th className="px-4 py-3 text-left font-semibold">Total Tipped</th>
            <th className="px-4 py-3 text-left font-semibold">Tips</th>
            <th className="px-4 py-3 text-left font-semibold">Last Tip</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tipper, index) => (
            <tr key={tipper.id} className="border-b hover:bg-muted/30 transition">
              <td className="px-4 py-3 text-muted-foreground">#{index + 1}</td>
              <td className="px-4 py-3 font-medium">{tipper.name}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrency(tipper.totalAmount)}</td>
              <td className="px-4 py-3">{tipper.tipCount}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(tipper.lastTipAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
