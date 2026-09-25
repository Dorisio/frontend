import { describe, it, expect } from 'vitest';
import { applyTransactionFilters, transactionsToCsv } from './use-transaction-filter';
import type { Transaction } from './use-transaction-history';
import type { TransactionFilterState } from './use-transaction-filter';

const baseFilters: TransactionFilterState = {
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  messageKeyword: '',
  status: 'all',
  sortField: 'date',
  sortDirection: 'desc',
};

const transactions: Transaction[] = [
  {
    id: '1',
    amount: 10,
    status: 'confirmed',
    createdAt: '2026-01-01T00:00:00Z',
    senderUsername: 'alice',
    message: 'Amazing tutorial',
  },
  {
    id: '2',
    amount: 50,
    status: 'pending',
    createdAt: '2026-01-15T00:00:00Z',
    senderUsername: 'bob',
  },
  {
    id: '3',
    amount: 25,
    status: 'failed',
    createdAt: '2026-01-10T00:00:00Z',
    senderUsername: 'carol',
  },
];

describe('applyTransactionFilters', () => {
  it('returns all transactions sorted by date descending by default', () => {
    const result = applyTransactionFilters(transactions, baseFilters);
    expect(result.map((t) => t.id)).toEqual(['2', '3', '1']);
  });

  it('filters by minimum amount', () => {
    const result = applyTransactionFilters(transactions, { ...baseFilters, minAmount: '20' });
    expect(result.map((t) => t.id).sort()).toEqual(['2', '3']);
  });

  it('filters by maximum amount', () => {
    const result = applyTransactionFilters(transactions, { ...baseFilters, maxAmount: '20' });
    expect(result.map((t) => t.id)).toEqual(['1']);
  });

  it('filters by amount range (min and max together)', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      minAmount: '15',
      maxAmount: '30',
    });
    expect(result.map((t) => t.id)).toEqual(['3']);
  });

  it('filters by status', () => {
    const result = applyTransactionFilters(transactions, { ...baseFilters, status: 'pending' });
    expect(result.map((t) => t.id)).toEqual(['2']);
  });

  it('filters by date range', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      dateFrom: '2026-01-05',
      dateTo: '2026-01-12',
    });
    expect(result.map((t) => t.id)).toEqual(['3']);
  });

  it('sorts by amount ascending', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      sortField: 'amount',
      sortDirection: 'asc',
    });
    expect(result.map((t) => t.id)).toEqual(['1', '3', '2']);
  });

  it('sorts by amount descending', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      sortField: 'amount',
      sortDirection: 'desc',
    });
    expect(result.map((t) => t.id)).toEqual(['2', '3', '1']);
  });

  it('filters by message keyword', () => {
    const result = applyTransactionFilters(transactions, { ...baseFilters, messageKeyword: 'tutorial' });
    expect(result.map((t) => t.id)).toEqual(['1']);
  });

  it('combines multiple filters together', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      minAmount: '20',
      status: 'failed',
    });
    expect(result.map((t) => t.id)).toEqual(['3']);
  });

  it('ignores invalid numeric filter input rather than throwing', () => {
    const result = applyTransactionFilters(transactions, {
      ...baseFilters,
      minAmount: 'not-a-number',
    });
    expect(result).toHaveLength(3);
  });

  it('returns an empty array when nothing matches', () => {
    const result = applyTransactionFilters(transactions, { ...baseFilters, minAmount: '1000' });
    expect(result).toEqual([]);
  });
});

describe('transactionsToCsv', () => {
  it('produces a header row followed by one row per transaction', () => {
    const csv = transactionsToCsv(transactions);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Date,Amount,From,Message,Status,Transaction Hash');
    expect(lines).toHaveLength(4);
  });

  it('escapes fields containing commas or quotes', () => {
    const csv = transactionsToCsv([
      {
        id: '1',
        amount: 10,
        status: 'confirmed',
        createdAt: '2026-01-01T00:00:00Z',
        senderUsername: 'alice, "the great"',
      },
    ]);
    expect(csv).toContain('"alice, ""the great"""');
  });

  it('falls back to senderId when senderUsername is absent', () => {
    const csv = transactionsToCsv([
      {
        id: '1',
        amount: 10,
        status: 'confirmed',
        createdAt: '2026-01-01T00:00:00Z',
        senderId: 'sender-abc',
      },
    ]);
    expect(csv).toContain('sender-abc');
  });

  it('returns just the header row for an empty transaction list', () => {
    const csv = transactionsToCsv([]);
    expect(csv).toBe('Date,Amount,From,Message,Status,Transaction Hash');
  });
});
