import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        // Bug #8: Store access token in window global for the axios interceptor
        window.__nutriguide_access_token = accessToken;
        set({ user, accessToken, isAuthenticated: true });
      },
      logout: () => {
        // Clear the in-memory access token
        window.__nutriguide_access_token = null;
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      // Bug #8: Only persist user + isAuthenticated, NOT the accessToken
      // The access token lives only in memory (Zustand state + window global).
      // The refresh token lives in an HTTP-only cookie (set by the server).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Bug #12: On rehydration, if isAuthenticated but no accessToken in memory,
      // attempt a silent refresh via the HTTP-only cookie
      onRehydrateStorage: () => {
        return (state) => {
          if (state?.isAuthenticated && !state.accessToken) {
            // Attempt silent refresh — the cookie will be sent automatically
            fetch(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            })
              .then((res) => {
                if (!res.ok) throw new Error('Refresh failed');
                return res.json();
              })
              .then((data) => {
                const newToken = data.data.accessToken;
                window.__nutriguide_access_token = newToken;
                state.setAuth(state.user!, newToken);
              })
              .catch(() => {
                // Refresh cookie expired or invalid — clean logout
                state.logout();
              });
          }
        };
      },
    }
  )
);
