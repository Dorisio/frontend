'use client';

import { useEffect, useState } from 'react';
import {
  SUBSCRIPTIONS_KEY,
  SUBSCRIPTION_TIERS_KEY,
  createSubscription,
  readStoredValue,
  writeStoredValue,
} from '@/lib/subscriptions';
import type { BillingInterval, Subscription, SubscriptionTier } from '@/types/subscriptions';

function tiersForCreator(creatorId: string): SubscriptionTier[] {
  return readStoredValue<SubscriptionTier[]>(SUBSCRIPTION_TIERS_KEY, []).filter(
    (tier) => tier.creatorId === creatorId && tier.active
  );
}

export function useSubscriptions(creatorId: string | null | undefined, subscriberId?: string) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!creatorId) return;
    setTiers(tiersForCreator(creatorId));
    setSubscriptions(readStoredValue<Subscription[]>(SUBSCRIPTIONS_KEY, []));
  }, [creatorId]);

  const saveTiers = (nextTiers: SubscriptionTier[]): void => {
    const allTiers = readStoredValue<SubscriptionTier[]>(SUBSCRIPTION_TIERS_KEY, []).filter(
      (tier) => tier.creatorId !== creatorId
    );
    const next = [...allTiers, ...nextTiers];
    writeStoredValue(SUBSCRIPTION_TIERS_KEY, next);
    setTiers(nextTiers);
  };

  const subscribe = (tier: SubscriptionTier, interval: BillingInterval): Subscription | null => {
    if (!subscriberId) return null;
    const nextSubscription = createSubscription(tier, subscriberId, interval);
    const allSubscriptions = readStoredValue<Subscription[]>(SUBSCRIPTIONS_KEY, []).filter(
      (subscription) =>
        !(subscription.creatorId === tier.creatorId &&
          subscription.subscriberId === subscriberId &&
          subscription.status === 'active')
    );
    writeStoredValue(SUBSCRIPTIONS_KEY, [...allSubscriptions, nextSubscription]);
    setSubscriptions([...allSubscriptions, nextSubscription]);
    return nextSubscription;
  };

  const cancel = (subscriptionId: string): void => {
    const next = subscriptions.map((subscription) =>
      subscription.id === subscriptionId
        ? { ...subscription, status: 'cancelled' as const, cancelledAt: new Date().toISOString() }
        : subscription
    );
    writeStoredValue(SUBSCRIPTIONS_KEY, next);
    setSubscriptions(next);
  };

  const activeSubscription = subscriptions.find(
    (subscription) =>
      subscription.creatorId === creatorId &&
      subscription.subscriberId === subscriberId &&
      subscription.status === 'active'
  );

  return { tiers, subscriptions, activeSubscription, saveTiers, subscribe, cancel };
}
