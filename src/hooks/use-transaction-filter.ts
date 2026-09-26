/**
 * useTransactionFilter Hook
 * Client-side filtering, sorting, and CSV export for a page of transactions.
 *
 * Note: the underlying SDK (dorisio-sdk) only supports server-side pagination
 * for transaction history, not server-side filtering. This hook filters and
 * sorts the currently-loaded page of transactions and syncs filter state to
 * URL params so a filtered view is shareable.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Transaction } from './use-transaction-history';

export type TransactionSortField = 'date' | 'amount';
export type SortDirection = 'asc' | 'desc';
export type TransactionStatusFilter = 'all' | 'pending' | 'confirmed' | 'failed';

export interface TransactionFilterState {
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  messageKeyword: string;
  status: TransactionStatusFilter;
  sortField: TransactionSortField;
  sortDirection: SortDirection;
}

const DEFAULT_FILTERS: TransactionFilterState = {
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  messageKeyword: '',
  status: 'all',
  sortField: 'date',
  sortDirection: 'desc',
};

const DEBOUNCE_MS = 300;

function filtersFromSearchParams(params: URLSearchParams): TransactionFilterState {
  return {
    dateFrom: params.get('dateFrom') || DEFAULT_FILTERS.dateFrom,
    dateTo: params.get('dateTo') || DEFAULT_FILTERS.dateTo,
    minAmount: params.get('minAmount') || DEFAULT_FILTERS.minAmount,
    maxAmount: params.get('maxAmount') || DEFAULT_FILTERS.maxAmount,
    messageKeyword: params.get('messageKeyword') || DEFAULT_FILTERS.messageKeyword,
    status: (params.get('status') as TransactionStatusFilter) || DEFAULT_FILTERS.status,
    sortField: (params.get('sortField') as TransactionSortField) || DEFAULT_FILTERS.sortField,
    sortDirection: (params.get('sortDirection') as SortDirection) || DEFAULT_FILTERS.sortDirection,
  };
}

export function applyTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFilterState
): Transaction[] {
  let result = transactions;

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((t) => new Date(t.createdAt).getTime() >= from);
  }

  if (filters.dateTo) {
    // Date inputs represent a calendar day; include the entire selected day.
    const to = new Date(`${filters.dateTo}T23:59:59.999`).getTime();
    result = result.filter((t) => new Date(t.createdAt).getTime() <= to);
  }

  if (filters.minAmount !== '') {
    const min = parseFloat(filters.minAmount);
    if (!Number.isNaN(min)) result = result.filter((t) => t.amount >= min);
  }

  if (filters.maxAmount !== '') {
    const max = parseFloat(filters.maxAmount);
    if (!Number.isNaN(max)) result = result.filter((t) => t.amount <= max);
  }

  if (filters.status !== 'all') {
    result = result.filter((t) => t.status === filters.status);
  }

  if (filters.messageKeyword.trim()) {
    const keyword = filters.messageKeyword.trim().toLowerCase();
    result = result.filter((t) => {
      const message = t.message?.toLowerCase() || '';
      const sender = (t.senderUsername || t.senderId || '').toLowerCase();
      return message.includes(keyword) || sender.includes(keyword);
    });
  }

  const sorted = [...result].sort((a, b) => {
    const direction = filters.sortDirection === 'asc' ? 1 : -1;
    if (filters.sortField === 'amount') {
      return (a.amount - b.amount) * direction;
    }
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
  });

  return sorted;
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const headers = ['Date', 'Amount', 'From', 'Message', 'Status', 'Transaction Hash'];
  const rows = transactions.map((t) => [
    t.createdAt,
    t.amount.toString(),
    t.senderUsername || t.senderId || '',
    t.message || '',
    t.status,
    t.transactionHash || '',
  ]);

  const escapeCsvField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  return [headers, ...rows].map((row) => row.map(escapeCsvField).join(',')).join('\n');
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function transactionRows(transactions: Transaction[]): string {
  return transactions
    .map(
      (t) => `
        <tr>
          <td>${escapeHtml(t.createdAt)}</td>
          <td>${escapeHtml(t.amount.toString())}</td>
          <td>${escapeHtml(t.senderUsername || t.senderId || '')}</td>
          <td>${escapeHtml(t.message || '')}</td>
          <td>${escapeHtml(t.status)}</td>
          <td>${escapeHtml(t.transactionHash || '')}</td>
        </tr>`
    )
    .join('');
}

export function transactionsToExcelHtml(transactions: Transaction[]): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; }
      th, td { border: 1px solid #d0d7de; padding: 6px 8px; text-align: left; }
      th { background: #f6f8fa; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>From</th>
          <th>Message</th>
          <th>Status</th>
          <th>Transaction Hash</th>
        </tr>
      </thead>
      <tbody>${transactionRows(transactions)}</tbody>
    </table>
  </body>
</html>`;
}

export function transactionsToPrintableHtml(transactions: Transaction[], title: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { color: #111827; font-family: Arial, sans-serif; margin: 32px; }
      h1 { font-size: 22px; margin: 0 0 16px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border-bottom: 1px solid #d1d5db; padding: 8px; text-align: left; }
      th { background: #f3f4f6; font-size: 12px; text-transform: uppercase; }
      td { font-size: 12px; vertical-align: top; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Amount</th>
          <th>From</th>
          <th>Message</th>
          <th>Status</th>
          <th>Transaction Hash</th>
        </tr>
      </thead>
      <tbody>${transactionRows(transactions)}</tbody>
    </table>
  </body>
</html>`;
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadExcel(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPdfReport(htmlContent: string): void {
  const reportWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!reportWindow) return;

  reportWindow.document.open();
  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
  reportWindow.focus();
  reportWindow.print();
}

export function useTransactionFilter(transactions: Transaction[]): {
  filters: TransactionFilterState;
  setFilter: <K extends keyof TransactionFilterState>(
    key: K,
    value: TransactionFilterState[K]
  ) => void;
  resetFilters: () => void;
  filteredTransactions: Transaction[];
  exportToCsv: (filenamePrefix?: string) => void;
  exportToExcel: (filenamePrefix?: string) => void;
  exportToPdf: (title?: string) => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TransactionFilterState>(() =>
    filtersFromSearchParams(searchParams)
  );

  // Debounce URL updates so rapid filter changes don't spam history/navigation.
  useEffect(() => {
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        const isDefault = value === DEFAULT_FILTERS[key as keyof TransactionFilterState];
        if (value && !isDefault) {
          params.set(key, value);
        }
      });
      const query = params.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof TransactionFilterState>(key: K, value: TransactionFilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredTransactions = useMemo(
    () => applyTransactionFilters(transactions, filters),
    [transactions, filters]
  );

  const exportToCsv = useCallback(
    (filenamePrefix = 'transactions') => {
      const csv = transactionsToCsv(filteredTransactions);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `${filenamePrefix}-${date}.csv`);
    },
    [filteredTransactions]
  );

  const exportToExcel = useCallback(
    (filenamePrefix = 'transactions') => {
      const html = transactionsToExcelHtml(filteredTransactions);
      const date = new Date().toISOString().slice(0, 10);
      downloadExcel(html, `${filenamePrefix}-${date}.xls`);
    },
    [filteredTransactions]
  );

  const exportToPdf = useCallback(
    (title = 'Transaction History') => {
      const html = transactionsToPrintableHtml(filteredTransactions, title);
      printPdfReport(html);
    },
    [filteredTransactions]
  );

  return {
    filters,
    setFilter,
    resetFilters,
    filteredTransactions,
    exportToCsv,
    exportToExcel,
    exportToPdf,
  };
}
