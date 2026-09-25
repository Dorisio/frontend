/**
 * Auth Store
 * Manages authentication state globally
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateSDKToken } from '@/lib/sdk-client';
import type { CreatorVerificationStatus } from '@/types';

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
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }),
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
        updateSDKToken(state?.token ?? null);
        state?.setHasHydrated(true);
      },
    }
  )
);
