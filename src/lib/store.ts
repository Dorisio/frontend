import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  setToken: (token: string) => set({ token }),
  setUser: (user: User) => set({ user }),
  logout: () => set({ token: null, user: null }),
}));
