import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest, AuthUser } from '@/lib/api';

const TOKEN_KEY = 'tasktimer_mobile_token';
const USER_KEY = 'tasktimer_mobile_user';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthResponse = {
  user: AuthUser;
  token: string;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as AuthUser);
      }

      setIsLoading(false);
    }

    restoreSession();
  }, []);

  async function saveSession(response: AuthResponse) {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, response.token),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user)),
    ]);
    setToken(response.token);
    setUser(response.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      async login(email, password) {
        const response = await apiRequest<AuthResponse>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });
        await saveSession(response);
      },
      async register(email, password) {
        const response = await apiRequest<AuthResponse>('/api/auth/register', {
          method: 'POST',
          body: { email, password },
        });
        await saveSession(response);
      },
      async logout() {
        await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
        setToken(null);
        setUser(null);
        router.replace('/login');
      },
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
