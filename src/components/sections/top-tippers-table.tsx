/**
 * Top Tippers Table
 * Lists a creator's top supporters sorted by total tip amount.
 *
 * Mobile-first: the `responsive-table` class (see `src/app/globals.css`) turns
 * each row into a stacked card below the `md` breakpoint and prints the column
 * name from every cell's `data-label`. No column is removed, so the total
 * tipped and the last tip date both stay visible on a 320px phone, and the
 * table never needs horizontal scrolling.
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
    <div
      className="w-full max-h-96 overflow-x-auto overflow-y-auto rounded-lg border"
      data-testid="top-tippers-table"
    >
      <table className="responsive-table w-full text-sm">
        <caption className="sr-only">
          Top tippers for this period, ranked by total amount tipped, highest first.
        </caption>
        <thead className="border-b bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Tipper
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Total Tipped
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Tips
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Last Tip
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold sticky top-0 z-10 bg-muted">
              Latest Message
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tipper, index) => (
            <tr key={tipper.id} className="border-b hover:bg-muted/30 transition">
              <td data-label="Rank" className="px-4 py-3 text-muted-foreground">
                #{index + 1}
              </td>
              <td data-label="Tipper" className="px-4 py-3 font-medium">
                {tipper.name}
              </td>
              <td data-label="Total Tipped" className="px-4 py-3 font-semibold">
                {formatCurrency(tipper.totalAmount)}
              </td>
              <td data-label="Tips" className="px-4 py-3">
                {tipper.tipCount}
              </td>
              <td data-label="Last Tip" className="px-4 py-3 text-muted-foreground">
                {formatDate(tipper.lastTipAt)}
              </td>
              <td
                data-label="Latest Message"
                className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate"
              >
                {tipper.latestMessage ? tipper.latestMessage : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}