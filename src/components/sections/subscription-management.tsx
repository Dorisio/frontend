'use client';

import { Card } from '@/components/ui/card';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { formatCurrency } from '@/utils/formatters';

interface SubscriptionManagementProps {
  creatorId: string;
}

export function SubscriptionManagement({ creatorId }: SubscriptionManagementProps): JSX.Element {
  const { subscriptions, cancel } = useSubscriptions(creatorId);
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.creatorId === creatorId && subscription.status === 'active'
  );

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Membership management</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage active recurring supporters.</p>
        </div>
        <span className="text-2xl font-bold">{activeSubscriptions.length}</span>
      </div>
      {activeSubscriptions.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No active memberships yet.</p>
      ) : (
        <div className="mt-5 space-y-2">
          {activeSubscriptions.map((subscription) => (
            <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3 text-sm">
              <span>Supporter {subscription.subscriberId}</span>
              <span className="text-muted-foreground">{formatCurrency(subscription.amount)}/{subscription.interval === 'monthly' ? 'mo' : 'yr'}</span>
              <button type="button" className="text-destructive hover:underline" onClick={() => cancel(subscription.id)}>Cancel</button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
