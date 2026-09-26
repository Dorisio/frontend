'use client';

import { useState } from 'react';
import { Check, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { formatCurrency } from '@/utils/formatters';
import { SubscriberBadge } from '@/components/shared/subscriber-badge';
import type { BillingInterval } from '@/types/subscriptions';

interface SubscriptionTiersProps {
  creatorId: string;
  subscriberId?: string;
}

export function SubscriptionTiers({ creatorId, subscriberId }: SubscriptionTiersProps): JSX.Element | null {
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [message, setMessage] = useState<string | null>(null);
  const { tiers, activeSubscription, subscribe } = useSubscriptions(creatorId, subscriberId);

  if (tiers.length === 0) return null;

  const handleSubscribe = (tierId: string): void => {
    const tier = tiers.find((item) => item.id === tierId);
    if (!tier) return;
    if (!subscriberId) {
      setMessage('Sign in to subscribe to this creator.');
      return;
    }
    subscribe(tier, interval);
    setMessage(`You are now supporting ${tier.name}.`);
  };

  return (
    <section aria-labelledby="membership-heading" className="mt-10 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 id="membership-heading" className="text-xl font-bold">Membership</h2>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Support this creator every month or year.</span>
            {activeSubscription && <SubscriberBadge />}
          </div>
        </div>
        <div className="inline-flex rounded-md border p-1" role="group" aria-label="Billing interval">
          <button type="button" aria-pressed={interval === 'monthly'} onClick={() => setInterval('monthly')} className={`rounded px-3 py-1 text-sm ${interval === 'monthly' ? 'bg-primary text-primary-foreground' : ''}`}>Monthly</button>
          <button type="button" aria-pressed={interval === 'yearly'} onClick={() => setInterval('yearly')} className={`rounded px-3 py-1 text-sm ${interval === 'yearly' ? 'bg-primary text-primary-foreground' : ''}`}>Yearly</button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {tiers.map((tier) => {
          const isActive = activeSubscription?.tierId === tier.id;
          return (
            <Card key={tier.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
                </div>
                {isActive && <span className="text-xs font-medium text-primary">Active</span>}
              </div>
              <p className="mt-4 text-2xl font-bold">
                {formatCurrency(interval === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice)}
                <span className="text-sm font-normal text-muted-foreground">/{interval === 'monthly' ? 'mo' : 'yr'}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {tier.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />{benefit}</li>
                ))}
              </ul>
              <Button type="button" className="mt-5 w-full" disabled={isActive} onClick={() => handleSubscribe(tier.id)}>
                {isActive ? 'Subscribed' : `Subscribe ${interval === 'monthly' ? 'monthly' : 'yearly'}`}
              </Button>
            </Card>
          );
        })}
      </div>
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </section>
  );
}
