import type { BillingInterval, Subscription, SubscriptionTier, SubscriptionTierDraft } from '@/types/subscriptions';

export const SUBSCRIPTION_TIERS_KEY = 'dorisio:subscription-tiers';
export const SUBSCRIPTIONS_KEY = 'dorisio:subscriptions';

export function getTierPrice(tier: SubscriptionTier, interval: BillingInterval): number {
  return interval === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
}

export function calculateRenewalDate(startDate: Date, interval: BillingInterval): string {
  const renewalDate = new Date(startDate);
  if (interval === 'monthly') {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  } else {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  }
  return renewalDate.toISOString();
}

export function createSubscription(
  tier: SubscriptionTier,
  subscriberId: string,
  interval: BillingInterval,
  startDate = new Date()
): Subscription {
  return {
    id: `subscription-${tier.id}-${subscriberId}-${startDate.getTime()}`,
    tierId: tier.id,
    creatorId: tier.creatorId,
    subscriberId,
    interval,
    amount: getTierPrice(tier, interval),
    status: 'active',
    startedAt: startDate.toISOString(),
    renewsAt: calculateRenewalDate(startDate, interval),
  };
}

export function tierFromDraft(
  draft: SubscriptionTierDraft,
  creatorId: string,
  id = `tier-${Date.now()}`
): SubscriptionTier | null {
  const monthlyPrice = Number(draft.monthlyPrice);
  const yearlyPrice = Number(draft.yearlyPrice);
  const name = draft.name.trim();

  if (!name || !Number.isFinite(monthlyPrice) || monthlyPrice <= 0 || !Number.isFinite(yearlyPrice) || yearlyPrice <= 0) {
    return null;
  }

  return {
    id,
    creatorId,
    name,
    description: draft.description.trim(),
    monthlyPrice,
    yearlyPrice,
    benefits: draft.benefits
      .split('\n')
      .map((benefit) => benefit.trim())
      .filter(Boolean),
    active: true,
  };
}

export function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredValue<T>(key: string, value: T): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}
