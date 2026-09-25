/**
 * Transaction Filter Bar
 * Date range, amount range, status, and sort controls for transaction history,
 * plus CSV export of the currently filtered rows.
 */

'use client';

import { Download } from 'lucide-react';
import type { TransactionFilterState } from '@/hooks/use-transaction-filter';

export interface TransactionFilterBarProps {
  filters: TransactionFilterState;
  onChange: <K extends keyof TransactionFilterState>(
    key: K,
    value: TransactionFilterState[K]
  ) => void;
  onReset: () => void;
  onExport: () => void;
  resultCount: number;
}

export function TransactionFilterBar({
  filters,
  onChange,
  onReset,
  onExport,
  resultCount,
}: TransactionFilterBarProps): JSX.Element {
  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid="transaction-filter-bar">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label htmlFor="filter-date-from" className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <input
            id="filter-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onChange('dateFrom', e.target.value)}
            className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label htmlFor="filter-date-to" className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <input
            id="filter-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(e) => onChange('dateTo', e.target.value)}
            className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label htmlFor="filter-min-amount" className="text-xs font-medium text-muted-foreground">
            Min amount
          </label>
          <input
            id="filter-min-amount"
            type="number"
            min="0"
            step="0.01"
            value={filters.minAmount}
            onChange={(e) => onChange('minAmount', e.target.value)}
            placeholder="0"
            className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label htmlFor="filter-max-amount" className="text-xs font-medium text-muted-foreground">
            Max amount
          </label>
          <input
            id="filter-max-amount"
            type="number"
            min="0"
            step="0.01"
            value={filters.maxAmount}
            onChange={(e) => onChange('maxAmount', e.target.value)}
            placeholder="Any"
            className="w-full mt-1 px-2 py-1.5 border rounded text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <label
            htmlFor="filter-message-keyword"
            className="text-xs font-medium text-muted-foreground"
          >
            Message search
          </label>
          <input
            id="filter-message-keyword"
            type="search"
            value={filters.messageKeyword}
            onChange={(e) => onChange('messageKeyword', e.target.value)}
            placeholder="Search message or tipper"
            className="block w-full mt-1 px-2 py-1.5 border rounded text-sm"
          />
        </div>

        <div>
          <label htmlFor="filter-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => onChange('status', e.target.value as TransactionFilterState['status'])}
            className="block mt-1 px-2 py-1.5 border rounded text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort-field" className="text-xs font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="filter-sort-field"
            value={filters.sortField}
            onChange={(e) =>
              onChange('sortField', e.target.value as TransactionFilterState['sortField'])
            }
            className="block mt-1 px-2 py-1.5 border rounded text-sm"
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-sort-direction" className="text-xs font-medium text-muted-foreground">
            Order
          </label>
          <select
            id="filter-sort-direction"
            value={filters.sortDirection}
            onChange={(e) =>
              onChange('sortDirection', e.target.value as TransactionFilterState['sortDirection'])
            }
            className="block mt-1 px-2 py-1.5 border rounded text-sm"
          >
            <option value="desc">Newest / Highest first</option>
            <option value="asc">Oldest / Lowest first</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 text-sm border rounded hover:bg-muted transition"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={resultCount === 0}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV ({resultCount})
        </button>
      </div>
    </div>
  );
}
