/**
 * Hooks
 * Custom React hooks for SDK integration
 */

export { useCreateTip, type CreateTipPayload, type TipResponse } from './use-create-tip';
export { useWallet, type WalletInfo } from './use-wallet';
export { useCreatorBalance, type CreatorBalance } from './use-creator-balance';
export { useTransactionHistory, type Transaction } from './use-transaction-history';
export { useAuthHydration, type UseAuthHydrationResult } from './use-auth-hydration';
export { useCreatorAnalytics } from './use-creator-analytics';
export { useDebounce } from './use-debounce';
export { useTipTiers, type UseTipTiersResult } from './use-tip-tiers';
export { useScheduledTips, type UseScheduledTipsResult } from './use-scheduled-tips';
export { useSDKClient, getSDKClient, sdkClient, sdk } from '@/lib/sdk-provider';
