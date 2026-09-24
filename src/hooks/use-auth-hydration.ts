/**
 * useAuthHydration Hook
 *
 * Exposes whether the persisted auth store has finished rehydrating from
 * localStorage, and syncs a caller-supplied SDK client callback with the
 * restored token once hydration completes.
 *
 * This is intentionally decoupled from any concrete SDK client so it can be
 * unit tested without needing the `dorisio-sdk` package to resolve, and so
 * it can be reused by any top-level provider that needs to gate rendering
 * on auth hydration (see `src/app/providers.tsx`).
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export interface UseAuthHydrationResult {
  /** True once the persisted auth state has been read back from storage. */
  hasHydrated: boolean;
  /** The restored token, if any, once hydration has completed. */
  token: string | null;
}

/**
 * @param onTokenRestored Called once hydration completes with the restored
 *   token (or `null` if no session was persisted). Use this to sync an SDK
 *   client instance without this hook needing to know about it directly.
 */
export function useAuthHydration(onTokenRestored?: (token: string | null) => void): UseAuthHydrationResult {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (hasHydrated) {
      onTokenRestored?.(token);
    }
    // onTokenRestored is expected to be referentially stable (e.g. a
    // useMemo'd client's bound method); including it would re-run this
    // effect on every render for callers that pass an inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, token]);

  return { hasHydrated, token };
}
