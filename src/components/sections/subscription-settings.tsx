'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { tierFromDraft } from '@/lib/subscriptions';
import type { SubscriptionTierDraft } from '@/types/subscriptions';

const EMPTY_DRAFT: SubscriptionTierDraft = {
  name: '',
  description: '',
  monthlyPrice: '',
  yearlyPrice: '',
  benefits: '',
};

interface SubscriptionSettingsProps {
  creatorId: string;
}

export function SubscriptionSettings({ creatorId }: SubscriptionSettingsProps): JSX.Element {
  const [draft, setDraft] = useState<SubscriptionTierDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const { tiers, saveTiers } = useSubscriptions(creatorId);

  const updateDraft = (field: keyof SubscriptionTierDraft, value: string): void => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError(null);
  };

  const addTier = (): void => {
    const tier = tierFromDraft(draft, creatorId);
    if (!tier) {
      setError('Add a name and positive monthly and yearly prices.');
      return;
    }
    saveTiers([...tiers, tier]);
    setDraft(EMPTY_DRAFT);
  };

  return (
    <Card className="mb-6 p-6">
      <h2 className="text-xl font-semibold">Membership tiers</h2>
      <p className="mt-1 text-sm text-muted-foreground">Create monthly or yearly membership options for supporters.</p>
      {tiers.length > 0 && (
        <div className="mt-4 space-y-2" aria-label="Configured membership tiers">
          {tiers.map((tier) => (
            <div key={tier.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <span className="font-medium">{tier.name}</span>
              <span className="text-muted-foreground">${tier.monthlyPrice}/mo · ${tier.yearlyPrice}/yr</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input aria-label="Tier name" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="Tier name" className="rounded border px-3 py-2" />
        <input aria-label="Monthly price" inputMode="decimal" value={draft.monthlyPrice} onChange={(event) => updateDraft('monthlyPrice', event.target.value)} placeholder="Monthly price" className="rounded border px-3 py-2" />
        <input aria-label="Yearly price" inputMode="decimal" value={draft.yearlyPrice} onChange={(event) => updateDraft('yearlyPrice', event.target.value)} placeholder="Yearly price" className="rounded border px-3 py-2" />
        <input aria-label="Tier description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} placeholder="Short description" className="rounded border px-3 py-2" />
        <textarea aria-label="Tier benefits" value={draft.benefits} onChange={(event) => updateDraft('benefits', event.target.value)} placeholder="One benefit per line" rows={3} className="rounded border px-3 py-2 sm:col-span-2" />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <Button type="button" className="mt-4" onClick={addTier}>Add membership tier</Button>
    </Card>
  );
}
