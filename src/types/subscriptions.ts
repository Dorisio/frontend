export type BillingInterval = 'monthly' | 'yearly';

export interface SubscriptionTier {
  id: string;
  creatorId: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  benefits: string[];
  active: boolean;
}

export interface Subscription {
  id: string;
  tierId: string;
  creatorId: string;
  subscriberId: string;
  interval: BillingInterval;
  amount: number;
  status: 'active' | 'cancelled';
  startedAt: string;
  renewsAt: string;
  cancelledAt?: string;
}

export interface SubscriptionTierDraft {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  benefits: string;
}
