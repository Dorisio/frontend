import { describe, expect, it } from 'vitest';
import { calculateSupporterAnalytics } from '@/lib/supporter-analytics';
import type { SupporterCreator, SupporterTransaction } from '@/types/supporter-analytics';

const now = new Date('2026-10-02T12:00:00.000Z');
const creators: SupporterCreator[] = [
  { id: 'creator-a', username: 'alice', displayName: 'Alice' },
  { id: 'creator-b', username: 'bob', displayName: 'Bob' },
];
const transactions: SupporterTransaction[] = [
  { id: 'one', creatorId: 'creator-a', amount: 10, status: 'confirmed', createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'two', creatorId: 'creator-a', amount: 20, status: 'confirmed', createdAt: '2026-09-20T10:00:00.000Z' },
  { id: 'three', creatorId: 'creator-b', amount: 30, status: 'confirmed', createdAt: '2026-08-01T10:00:00.000Z' },
  { id: 'pending', creatorId: 'creator-b', amount: 100, status: 'pending', createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 'failed', creatorId: 'creator-b', amount: 200, status: 'failed', createdAt: '2026-10-01T10:00:00.000Z' },
];

describe('calculateSupporterAnalytics', () => {
  it('calculates confirmed spend, average tip, top creator, and daily trend for selected range', () => {
    const result = calculateSupporterAnalytics(transactions, creators, '30d', now);
    expect(result.totalSpent).toBe(30);
    expect(result.tipCount).toBe(2);
    expect(result.averageTip).toBe(15);
    expect(result.topCreators[0]).toMatchObject({ creatorName: 'Alice', amount: 30, tipCount: 2 });
    expect(result.spendingOverTime).toEqual([
      { date: '2026-09-20', amount: 20, tipCount: 1 },
      { date: '2026-10-01', amount: 10, tipCount: 1 },
    ]);
  });

  it('includes older confirmed tips for all-time analytics but excludes pending and failed tips', () => {
    const result = calculateSupporterAnalytics(transactions, creators, 'all', now);
    expect(result.totalSpent).toBe(60);
    expect(result.tipCount).toBe(3);
    expect(result.averageTip).toBe(20);
    expect(result.topCreators.map((creator) => creator.creatorName)).toEqual(['Alice', 'Bob']);
  });

  it('returns empty, finite metrics when no confirmed transactions exist', () => {
    const result = calculateSupporterAnalytics([], creators, '90d', now);
    expect(result).toMatchObject({ totalSpent: 0, averageTip: 0, tipCount: 0, topCreators: [], spendingOverTime: [] });
  });
});
