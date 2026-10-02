/**
 * Auth Store
 * Manages authentication state globally
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateSDKToken } from '@/lib/sdk-client';
import {
  broadcastSessionEvent,
  initSessionSync,
  shouldBroadcastStateChange,
} from '@/lib/session-sync';
import { unsubscribeFromPush } from '@/lib/push-notifications';
import { usePushNotificationPreferenceStore } from '@/stores/push-notification-preference-store';
import type { CreatorVerificationStatus } from '@/types';

/**
 * Best-effort push notification cleanup on logout. Not awaited by
 * `logout()` (which stays synchronous, matching the rest of this store's
 * actions) - the unsubscribe + preference reset run in the background so a
 * slow/failing unsubscribe never blocks sign-out.
 *
 * No UI in this codebase currently calls `useAuthStore.logout` yet (there's
 * no wired-up logout button), so this is hooked directly into the store
 * action itself: whichever UI eventually calls `logout()`, push cleanup
 * happens automatically alongside it rather than needing to be remembered
 * at every future call site.
 */
function cleanupPushSubscriptionOnLogout(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker
    .getRegistration('/service-worker.js')
    .then((registration) => {
      if (!registration) return;
      return unsubscribeFromPush(registration);
    })
    .catch((error) => {
      console.error('Failed to unsubscribe from push notifications on logout:', error);
    })
    .finally(() => {
      usePushNotificationPreferenceStore.getState().setOptedIn(false);
    });
}

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  role: 'fan' | 'creator' | 'admin';
  verified?: boolean;
  verificationStatus?: CreatorVerificationStatus;
  verifiedAt?: string;
  verificationType?: string;
  verificationReason?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // True once the persisted state has been read back from storage.
  // Consumers should avoid rendering auth-dependent UI until this is true,
  // otherwise they'll briefly see a "logged out" state on page load/refresh.
  hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
  login: (user: User, token: string) => void;
  syncCrossTab: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
        if (shouldBroadcastStateChange()) {
          broadcastSessionEvent('UPDATE_USER', { user });
        }
      },
      setToken: (token) => {
        set({ token });
        updateSDKToken(token);
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        updateSDKToken(token);
        if (shouldBroadcastStateChange()) {
          broadcastSessionEvent('LOGIN', { user, token });
        }
      },

      logout: () => {
        cleanupPushSubscriptionOnLogout();
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        updateSDKToken(null);
        if (shouldBroadcastStateChange()) {
          broadcastSessionEvent('LOGOUT');
        }
      },

      syncCrossTab: () => {
        if (shouldBroadcastStateChange()) {
          broadcastSessionEvent('SYNC_STATE');
        }
      },
    }),
    {
      name: 'Dorisio-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
      // Runs once the persisted state has been read back from localStorage.
      // We use this to (a) sync the SDK client singleton with the restored
      // token so it doesn't boot up unauthenticated, and (b) flip
      // `hasHydrated` so top-level providers can gate rendering until the
      // real auth state is known, avoiding a flash of "logged out" state.
      onRehydrateStorage: () => (state) => {
        // `setHasHydrated(true)` must run even if the SDK sync below fails -
        // it gates the entire app's render (see providers.tsx), so an SDK
        // client error must never leave the app stuck on the loading spinner.
        try {
          updateSDKToken(state?.token ?? null);
        } catch (error) {
          console.error('Failed to sync SDK client token during auth rehydration:', error);
        }
        state?.setHasHydrated(true);
      },
    }
  )
);

// Initialize cross-tab synchronization automatically in browser environments
if (typeof window !== 'undefined') {
  initSessionSync(useAuthStore);
}

