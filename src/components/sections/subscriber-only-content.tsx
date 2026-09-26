'use client';

import { LockKeyhole } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SubscriberBadge } from '@/components/shared/subscriber-badge';
import { useSubscriptions } from '@/hooks/use-subscriptions';

interface SubscriberOnlyContentProps {
  creatorId: string;
  subscriberId?: string;
  children: React.ReactNode;
}

export function SubscriberOnlyContent({ creatorId, subscriberId, children }: SubscriberOnlyContentProps): JSX.Element {
  const { activeSubscription } = useSubscriptions(creatorId, subscriberId);

  if (activeSubscription) {
    return (
      <section aria-label="Subscriber-only content" className="mt-10">
        <div className="mb-3 flex items-center gap-2"><SubscriberBadge /><span className="text-sm text-muted-foreground">Exclusive content</span></div>
        {children}
      </section>
    );
  }

  return (
    <Card className="mt-10 flex items-center gap-4 border-dashed p-6" aria-label="Subscriber-only content locked">
      <LockKeyhole className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <h2 className="font-semibold">Subscriber-only content</h2>
        <p className="text-sm text-muted-foreground">Subscribe to unlock this creator&apos;s exclusive posts.</p>
      </div>
    </Card>
  );
}
