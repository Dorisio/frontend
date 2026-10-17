/**
 * Creator profile / dashboard skeleton states (#8)
 *
 * Dimension-matched placeholders for the three loading states on the
 * public profile page and creator dashboard: the header (avatar + name +
 * stats), an earnings summary card, and the transaction table. Each
 * mirrors the real content's layout so nothing visibly reflows once data
 * arrives.
 */

import { Skeleton } from '@/components/shared/skeleton';

/**
 * Matches the profile header on `/creators/[username]`: a 32x32 (128px)
 * circular avatar, display name + verified badge, @username, bio, and the
 * two earnings stats above the tip button.
 */
export function ProfileHeaderSkeleton(): JSX.Element {
  return (
    <div
      aria-label="Loading creator profile"
      className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b"
      role="status"
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex gap-8 items-start">
          <Skeleton className="h-32 w-32 shrink-0 rounded-full" />
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-full max-w-md" />
            <div className="flex gap-8 pt-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <Skeleton className="h-11 w-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Matches one earnings overview card (Total Earnings / Available Balance
 * / Pending Balance) on the dashboard and profile pages: a label, a large
 * currency figure, and a caption line.
 */
export function EarningsCardSkeleton(): JSX.Element {
  return (
    <div
      aria-label="Loading earnings"
      className="bg-background border rounded-lg p-6 space-y-2"
      role="status"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/**
 * Matches the transaction history table: a header row plus `rows` body
 * rows, one skeleton block per column (Date, Amount, From, Status, Tx ID).
 */
export function TransactionTableSkeleton({ rows = 5 }: { rows?: number }): JSX.Element {
  return (
    <div
      aria-label="Loading transaction history"
      className="border rounded-lg overflow-x-auto"
      role="status"
    >
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Date</th>
            <th className="px-4 py-3 text-left font-semibold">Amount</th>
            <th className="px-4 py-3 text-left font-semibold">From</th>
            <th className="px-4 py-3 text-left font-semibold">Status</th>
            <th className="px-4 py-3 text-left font-semibold">Tx ID</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr className="border-b" key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-16 rounded" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-14" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Matches the top tippers table: header row (Rank, Tipper, Total Tipped, Tips, Last Tip, Latest Message)
 * plus `rows` body rows, one skeleton block per column.
 */
export function TopTippersTableSkeleton({ rows = 5 }: { rows?: number }): JSX.Element {
  return (
    <div
      aria-label="Loading top tippers"
      className="border rounded-lg overflow-x-auto"
      role="status"
    >
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold">Rank</th>
            <th className="px-4 py-3 text-left font-semibold">Tipper</th>
            <th className="px-4 py-3 text-left font-semibold">Total Tipped</th>
            <th className="px-4 py-3 text-left font-semibold">Tips</th>
            <th className="px-4 py-3 text-left font-semibold">Last Tip</th>
            <th className="px-4 py-3 text-left font-semibold">Latest Message</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr className="border-b" key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-6" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-10" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-36" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Matches the activity feed item layout: circular icon/avatar + title + badge + description + timestamp.
 */
export function ActivityFeedSkeleton({ count = 3 }: { count?: number }): JSX.Element {
  return (
    <div
      aria-label="Loading activity feed"
      className="space-y-3"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-muted"
        >
          <Skeleton className="w-10 h-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
