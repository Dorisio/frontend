/**
 * Frontend Types
 * Shared type definitions for the Dorisio frontend
 */

// Re-export SDK types for convenience
export type { CreateTipRequest, TipRequest } from 'dorisio-sdk';

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
