'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

// Simple factory function to create the store
const createAuthStore = () => {
  return create<AuthState>()(
    persist(
      (set) => ({
        token: null,
        user: null,
        isAuthenticated: false,
        setAuth: (token: string, user: User) =>
          set({
            token,
            user,
            isAuthenticated: true,
          }),
        logout: () =>
          set({
            token: null,
            user: null,
            isAuthenticated: false,
          }),
      }),
      {
        name: 'auth-storage',
      }
    )
  );
};

// Create the store
const useAuthStore = createAuthStore();

export { useAuthStore }; 