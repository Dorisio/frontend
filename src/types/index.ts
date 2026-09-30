/**
 * Frontend Types
 * Shared type definitions for the Dorisio frontend
 */

// Re-export SDK types for convenience
export type { CreateTipRequest, TipRequest } from 'dorisio-sdk';

export type CreatorVerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

/**
 * Media item types for creator portfolio
 */
export type MediaType = 'image' | 'video' | 'link';

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  category?: string;
  order: number;
  createdAt: string;
}

export interface ExternalLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  order: number;
}

export interface CreatorPortfolio {
  creatorId: string;
  mediaItems: MediaItem[];
  externalLinks: ExternalLink[];
}

export interface CreatorLiveStream {
  platform: 'twitch' | 'youtube';
  channelUrl: string;
  isLive: boolean;
  viewerCount?: number;
  videoId?: string;
  replayUrl?: string;
}

/**
 * Creator profile (extended from SDK)
 */
export interface Creator {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  category?: string;
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
  tipTiers?: number[];
  portfolio?: CreatorPortfolio;
  socialLinks?: SocialLinks;
  liveStream?: CreatorLiveStream;
}

export interface SocialLinks {
  twitter?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
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
 * Scheduled Tip Frequency
 */
export type ScheduledTipFrequency = 'once' | 'daily' | 'weekly' | 'monthly';

/**
 * Scheduled Tip Status
 */
export type ScheduledTipStatus = 'pending' | 'executed' | 'cancelled';

/**
 * Scheduled Tip
 */
export interface ScheduledTip {
  id: string;
  creatorId: string;
  creatorName?: string;
  amount: number;
  walletId?: string;
  message?: string;
  scheduledDate: string;
  frequency: ScheduledTipFrequency;
  status: ScheduledTipStatus;
  createdAt: string;
  executedAt?: string;
  cancelledAt?: string;
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
  latestMessage?: string;
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

/**
 * Notification types
 */
export type NotificationType = 'tip' | 'subscription' | 'milestone' | 'system' | 'collaboration';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

/**
 * Activity Feed Types
 */
export type ActivityType = 'announcement' | 'tip' | 'verification' | 'live' | 'content';

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  title: string;
  description?: string;
  amount?: number;
  isPublic?: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface ActivityFeedResponse {
  items: ActivityFeedItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ActivityFeedFilters {
  type?: ActivityType;
  creatorId?: string;
  startDate?: string;
  endDate?: string;
}

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden' | 'deleted';
export type ModerationItemType = 'comment' | 'tip_message' | 'announcement';

export interface ModerationItem {
  id: string;
  type: ModerationItemType;
  content: string;
  authorId: string;
  authorName: string;
  creatorId: string;
  status: ModerationStatus;
  createdAt: string;
  updatedAt?: string;
  reportCount?: number;
  isReported?: boolean;
}

export interface UserBlock {
  id: string;
  creatorId: string;
  blockedUserId: string;
  blockedUserName: string;
  reason: string;
  createdAt: string;
  blockedAt: string;
}

export type ModerationAction = 'block_user' | 'unblock_user' | 'delete_content' | 'hide_content' | 'approve_content';

export interface ModerationActionLog {
  id: string;
  itemId: string;
  action: ModerationAction;
  performedBy: string;
  performedByName: string;
  targetUserId?: string;
  targetUserName?: string;
  reason?: string;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  itemId: string;
  itemType: ModerationItemType;
  reportedBy: string;
  reportedByName: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface ModerationStats {
  totalItems: number;
  pendingItems: number;
  blockedUsers: number;
  reportsThisWeek: number;
  actionsThisMonth: number;
}

export interface ModerationFilters {
  status?: ModerationStatus;
  type?: ModerationItemType;
  reportedOnly?: boolean;
}
