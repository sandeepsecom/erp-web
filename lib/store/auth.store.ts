import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '../api';

interface Company {
  id: string;
  slug: string;
  name: string;
  role: string;
  isDefault: boolean;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  activeCompany: Company;
  companies: Company[];
}

interface AuthState {
  user: User | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        set({ user, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        setAccessToken(null);
        set({ user: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'erp_auth',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);