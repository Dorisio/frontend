/**
 * Frontend Types
 * Shared type definitions for the Dorisio frontend
 */

// Re-export SDK types for convenience
export type { CreateTipRequest, TipRequest } from 'dorisio-sdk';

export type CreatorVerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

/**
 * Creator profile (extended from SDK)
 */
export interface Creator {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  verified: boolean;
  verificationStatus?: CreatorVerificationStatus;
  verifiedAt?: string;
  verificationType?: string;
  verificationReason?: string;
  isPublic: boolean;
  totalEarnings: number;
  pendingBalance: number;
  createdAt: string;
}

/**
 * User profile
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: 'fan' | 'creator' | 'admin';
  verified?: boolean;
  createdAt?: string;
}

/**
 * Tip/Payment
 */
export interface Tip {
  id: string;
  fromUserId: string;
  creatorId: string;
  amount: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Page loading and error states
 */
export interface PageState {
  loading: boolean;
  error: string | null;
}

/**
 * Creator analytics
 *
 * The `dorisio-sdk` package has no analytics endpoint (only per-transaction
 * history and a plain earnings summary), so this shape is served by a Next.js
 * API route (`/api/creators/[username]/analytics`) under this app rather than
 * the SDK. See `src/app/api/creators/[username]/analytics/route.ts`.
 */
export type AnalyticsDateRangePreset = '30d' | '90d' | 'ytd' | 'custom';

/** A single day's earnings, for the earnings trend line chart. */
export interface EarningsTrendPoint {
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  amount: number;
}

/** A tip source/category's share of total tips, for the breakdown pie chart. */
export interface TipSourceBreakdownEntry {
  source: string;
  amount: number;
  count: number;
}

/** A single top tipper row, for the top tippers table. */
export interface TopTipper {
  id: string;
  name: string;
  totalAmount: number;
  tipCount: number;
  lastTipAt: string;
}

export interface CreatorAnalyticsSummary {
  totalEarnings: number;
  earningsThisMonth: number;
  earningsThisWeek: number;
  totalTips: number;
}

export interface CreatorAnalytics {
  range: AnalyticsDateRangePreset;
  startDate: string;
  endDate: string;
  summary: CreatorAnalyticsSummary;
  earningsTrend: EarningsTrendPoint[];
  sourceBreakdown: TipSourceBreakdownEntry[];
  topTippers: TopTipper[];
}
