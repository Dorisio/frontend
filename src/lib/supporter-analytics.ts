import type {
  SupporterAnalytics,
  SupporterAnalyticsPeriod,
  SupporterCreator,
  SupporterSpendPoint,
  SupporterTransaction,
  CreatorSpend,
} from '@/types/supporter-analytics';

function periodStart(period: SupporterAnalyticsPeriod, now: Date): Date | null {
  if (period === 'all') return null;
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (period === '30d' ? 29 : period === '90d' ? 89 : 364));
  return start;
}

function pointKey(date: Date, period: SupporterAnalyticsPeriod): string {
  if (period === '1y' || period === 'all') {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return date.toISOString().slice(0, 10);
}

function displayCreatorName(creator: SupporterCreator | undefined, creatorId: string): string {
  return creator?.displayName?.trim() || (creator ? `@${creator.username}` : `Creator ${creatorId.slice(0, 8)}`);
}

export function calculateSupporterAnalytics(
  transactions: SupporterTransaction[],
  creators: SupporterCreator[],
  period: SupporterAnalyticsPeriod,
  now = new Date(),
): SupporterAnalytics {
  const start = periodStart(period, now);
  const confirmed = transactions.filter((transaction) => {
    const created = new Date(transaction.createdAt);
    return transaction.status === 'confirmed' && Number.isFinite(created.getTime()) && (!start || created >= start) && created <= now;
  });
  const creatorById = new Map(creators.map((creator) => [creator.id, creator]));
  const totalsByCreator = new Map<string, CreatorSpend>();
  const totalsByPeriod = new Map<string, SupporterSpendPoint>();

  for (const transaction of confirmed) {
    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) continue;
    const amount = transaction.amount;
    const creator = creatorById.get(transaction.creatorId);
    const current = totalsByCreator.get(transaction.creatorId) ?? {
      creatorId: transaction.creatorId,
      creatorName: displayCreatorName(creator, transaction.creatorId),
      username: creator?.username ?? null,
      amount: 0,
      tipCount: 0,
    };
    current.amount += amount;
    current.tipCount += 1;
    totalsByCreator.set(transaction.creatorId, current);

    const key = pointKey(new Date(transaction.createdAt), period);
    const point = totalsByPeriod.get(key) ?? { date: key, amount: 0, tipCount: 0 };
    point.amount += amount;
    point.tipCount += 1;
    totalsByPeriod.set(key, point);
  }

  const totalSpent = confirmed.reduce((sum, transaction) => sum + (transaction.amount > 0 ? transaction.amount : 0), 0);
  const spendingOverTime = [...totalsByPeriod.values()].sort((left, right) => left.date.localeCompare(right.date));

  return {
    totalSpent,
    averageTip: confirmed.length ? totalSpent / confirmed.length : 0,
    tipCount: confirmed.length,
    topCreators: [...totalsByCreator.values()].sort((left, right) => right.amount - left.amount),
    spendingOverTime,
  };
}
