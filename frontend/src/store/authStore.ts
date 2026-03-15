'use client';

import { create } from 'zustand';
import { clearAuthSession, getStoredAuth, setAuthSession } from '@/lib/auth';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  setAuth: (user, token) => {
    setAuthSession(user, token);
    set({ user, token, hydrated: true });
  },
  logout: () => {
    clearAuthSession();
    set({ user: null, token: null, hydrated: true });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  hydrate: () => {
    const { user, token } = getStoredAuth();
    set({ user, token, hydrated: true });
  },
}));
