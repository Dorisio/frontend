import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateRenewalDate,
  createSubscription,
  getTierPrice,
  tierFromDraft,
} from './subscriptions';
import type { SubscriptionTier } from '@/types/subscriptions';

const tier: SubscriptionTier = {
  id: 'tier-1',
  creatorId: 'creator-1',
  name: 'Supporter',
  description: 'Monthly support',
  monthlyPrice: 5,
  yearlyPrice: 50,
  benefits: ['Member posts'],
  active: true,
};

describe('subscription logic', () => {
  beforeEach(() => localStorage.clear());

  it('selects the correct monthly or yearly price', () => {
    expect(getTierPrice(tier, 'monthly')).toBe(5);
    expect(getTierPrice(tier, 'yearly')).toBe(50);
  });

  it('calculates renewal dates for both billing intervals', () => {
    const start = new Date('2026-01-15T00:00:00.000Z');

    expect(calculateRenewalDate(start, 'monthly')).toBe('2026-02-15T00:00:00.000Z');
    expect(calculateRenewalDate(start, 'yearly')).toBe('2027-01-15T00:00:00.000Z');
  });

  it('creates an active subscription with the selected interval and amount', () => {
    const subscription = createSubscription(tier, 'supporter-1', 'yearly', new Date('2026-01-15T00:00:00.000Z'));

    expect(subscription).toMatchObject({
      tierId: 'tier-1',
      creatorId: 'creator-1',
      subscriberId: 'supporter-1',
      interval: 'yearly',
      amount: 50,
      status: 'active',
      renewsAt: '2027-01-15T00:00:00.000Z',
    });
  });

  it('validates tier drafts and splits benefits into lines', () => {
    expect(tierFromDraft({ name: '', description: '', monthlyPrice: '5', yearlyPrice: '50', benefits: '' }, 'creator-1')).toBeNull();

    expect(tierFromDraft({ name: ' Gold ', description: '  Extra access ', monthlyPrice: '5', yearlyPrice: '50', benefits: 'Posts\n Discord\n' }, 'creator-1', 'tier-2')).toEqual({
      id: 'tier-2',
      creatorId: 'creator-1',
      name: 'Gold',
      description: 'Extra access',
      monthlyPrice: 5,
      yearlyPrice: 50,
      benefits: ['Posts', 'Discord'],
      active: true,
    });
  });
});
