/**
 * TypeScript Declarations for dorisio-sdk and dorisio-sdk/react
 * Enables standalone frontend builds and type-checking when SDK is an uncompiled sibling.
 */

declare module 'dorisio-sdk' {
  export interface ClientConfig {
    apiUrl?: string;
    apiKey?: string;
    token?: string;
    network?: string;
    horizonUrl?: string;
    baseUrl?: string;
    requestIdGenerator?: () => string;
    [key: string]: unknown;
  }

  export interface Notification {
    id: string;
    userId: string;
    type: 'tip' | 'subscription' | 'milestone' | 'system' | 'collaboration' | 'commission';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    data?: Record<string, unknown>;
  }

  export interface CreateTipRequest {
    creatorId: string;
    amount: number;
    message?: string;
  }

  export interface TipRequest extends CreateTipRequest {}

  export interface Transaction {
    id: string;
    creatorId?: string;
    senderId?: string;
    senderUsername?: string;
    amount: number;
    message?: string;
    status: 'pending' | 'confirmed' | 'failed';
    createdAt: string;
    stellarTxHash?: string | null;
  }

  export interface Wallet {
    id: string;
    publicKey: string;
    userId?: string;
    name?: string | null;
    verified?: boolean;
    balance?: {
      available: number;
      pending: number;
      total: number;
    };
    [key: string]: unknown;
  }

  export class DorisioError extends Error {
    statusCode?: number;
    code?: string;
    requestId?: string;
    constructor(message: string, statusCode?: number, code?: string, requestId?: string);
  }

  export interface CreatorListResponse {
    total?: number;
    page?: number;
    pageSize?: number;
    creators?: unknown[];
    data?: unknown[];
  }

  export class DorisioClient {
    constructor(config?: ClientConfig);
    setToken(token: string | null): void;
    clearToken(): void;
    getConfig(): ClientConfig;
    getCreatorProfile(username: string): Promise<unknown>;
    createTip(payload: CreateTipRequest): Promise<Transaction>;
    listCreators(params?: Record<string, unknown>): Promise<CreatorListResponse>;
    getNotifications(userIdOrParams?: string | Record<string, unknown>): Promise<Notification[]>;
    markNotificationAsRead(id: string): Promise<unknown>;
    markAllNotificationsAsRead(userIdOrParams?: string | Record<string, unknown>): Promise<unknown>;
    isTransactionVerified(transactionId: string): Promise<boolean>;
    isSandboxMode(): boolean;
    getMode(): string;
    [key: string]: unknown;
  }
}

declare module 'dorisio-sdk/react' {
  import type { ReactNode } from 'react';
  import type { DorisioClient, Transaction, Wallet, CreateTipRequest } from 'dorisio-sdk';

  export interface DorisioProviderProps {
    client: DorisioClient;
    children: ReactNode;
  }

  export function DorisioProvider(props: DorisioProviderProps): JSX.Element;

  export function useDorisio(): {
    client: DorisioClient;
    isConnected?: boolean;
    setError?: (err: Error) => void;
    setIsLoading?: (loading: boolean) => void;
  };

  export function useWallet(): {
    wallets: Wallet[];
    selectedWallet?: Wallet | null;
    loading: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
    generateNonce: () => Promise<string>;
    getChallenge: (publicKey: string) => Promise<string>;
    verifyWallet: (
      publicKeyOrPayload: string | { publicKey: string; signature: string; nonce?: string },
      signature?: string
    ) => Promise<boolean | { verified: boolean; walletId?: string }>;
    listWallets: () => Promise<Wallet[]>;
    selectWallet: (walletIdOrWallet: string | Wallet) => void;
    unlinkWallet: (walletId: string) => Promise<void>;
    renameWallet: (walletId: string, name: string) => Promise<Wallet>;
    getBalance: (
      walletId?: string
    ) => Promise<{ available: number; pending: number; total: number }>;
    reset: () => void;
  };

  export interface UseCreateTipActions {
    createTip: (req: CreateTipRequest) => Promise<Transaction>;
    buildTransaction: () => Promise<unknown>;
    submitTransaction: () => Promise<unknown>;
    confirmTransaction: () => Promise<unknown>;
    reset: () => void;
  }

  export interface UseCreateTipState {
    data?: Transaction | null;
    loading: boolean;
    error: Error | null;
    step?: string;
  }

  export function useCreateTip(): UseCreateTipActions & UseCreateTipState;

  export function useCreatorBalance(creatorId?: string): {
    balance?: {
      totalEarnings?: number;
      pendingBalance?: number;
    } | null;
    loading: boolean;
    error: Error | null;
    fetchBalance: (creatorId: string) => Promise<unknown>;
    refetch?: () => Promise<unknown>;
    reset?: () => void;
  };

  export function useTransactionHistory(params?: { page?: number; pageSize?: number }): {
    transactions: Transaction[];
    total: number;
    page: number;
    pageSize: number;
    loading: boolean;
    error: Error | null;
    fetchHistory: () => Promise<unknown>;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setPageSize: (size: number) => void;
    refetch: () => Promise<unknown>;
    reset: () => void;
  };
}
