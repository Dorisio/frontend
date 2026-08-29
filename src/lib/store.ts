import { create } from 'zustand';
import type { UserResponse } from 'Dorisio-sdk';

interface AuthStore {
  token: string | null;
  user: UserResponse | null;
  setToken: (token: string) => void;
  setUser: (user: UserResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  setToken: (token: string) => set({ token }),
  setUser: (user: UserResponse) => set({ user }),
  logout: () => set({ token: null, user: null }),
}));
