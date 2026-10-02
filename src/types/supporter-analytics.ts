export type SupporterAnalyticsPeriod = '30d' | '90d' | '1y' | 'all';

export interface SupporterTransaction {
  id: string;
  creatorId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface SupporterCreator {
  id: string;
  username: string;
  displayName: string | null;
}

export interface SupporterSpendPoint {
  date: string;
  amount: number;
  tipCount: number;
}

export interface CreatorSpend {
  creatorId: string;
  creatorName: string;
  username: string | null;
  amount: number;
  tipCount: number;
}

export interface SupporterAnalytics {
  totalSpent: number;
  averageTip: number;
  tipCount: number;
  topCreators: CreatorSpend[];
  spendingOverTime: SupporterSpendPoint[];
}
