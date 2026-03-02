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
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'erp_auth',
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setAccessToken(state.accessToken);
        }
      },
    }
  )
);