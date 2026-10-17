import React from 'react';

export const DorisioProvider = ({ children }: { children?: React.ReactNode }): React.ReactNode =>
  children;

export const useDorisio = (): { client: unknown; isConnected: boolean } => ({
  client: null,
  isConnected: false,
});

export const useCreatorBalance = (): { balance: number; loading: boolean; error: null } => ({
  balance: 0,
  loading: false,
  error: null,
});

export const useTransactionHistory = (): {
  transactions: unknown[];
  loading: boolean;
  error: null;
} => ({
  transactions: [],
  loading: false,
  error: null,
});

export const useWallet = (): {
  wallets: unknown[];
  selectedWallet: null;
  loading: boolean;
  error: null;
} => ({
  wallets: [],
  selectedWallet: null,
  loading: false,
  error: null,
});

export const useCreateTip = (): {
  createTip: () => Promise<void>;
  loading: boolean;
} => ({
  createTip: async (): Promise<void> => {},
  loading: false,
});

export const isDorisioContext = (): boolean => true;

export const requireDorisioContext = (): { client: unknown } => ({ client: null });
