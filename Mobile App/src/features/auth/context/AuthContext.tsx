import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { api } from '@/services/api';
import { isUnauthorizedError } from '@/utils';

import { getMe } from '../services/auth.service';
import * as authStorage from '../storage/authStorage';
import type { AuthUser } from '../types/auth.types';

type AuthContextValue = {
  /** The current JWT, or `null` when signed out. */
  token: string | null;
  /** The current authenticated user from `GET /auth/me`, or `null`. */
  user: AuthUser | null;
  /** `true` only while the initial session-restore bootstrap is running. */
  isLoading: boolean;
  /** `true` once a JWT is present (does not imply the profile is complete). */
  isAuthenticated: boolean;
  /** Persists the token, attaches it to the API client, then refreshes `user`. */
  login: (newToken: string) => Promise<void>;
  /** Deletes the token, detaches it from the API client, and resets state. */
  logout: () => Promise<void>;
  /** Re-fetches `GET /auth/me`. Auto-logs-out on a 401. Safe to call anytime. */
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const applyAuthHeader = (token: string | null): void => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async (): Promise<void> => {
    await authStorage.clearSession();
    applyAuthHeader(null);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await getMe();
      setUser(me);
      await authStorage.setCachedUser(me);
      return me;
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await logout();
      }
      return null;
    }
  }, [logout]);

  const login = useCallback(
    async (newToken: string): Promise<void> => {
      await authStorage.setToken(newToken);
      applyAuthHeader(newToken);
      setToken(newToken);
      await refreshUser();
    },
    [refreshUser],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const storedToken = await authStorage.getToken();

      if (!storedToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      applyAuthHeader(storedToken);
      const cachedUser = await authStorage.getCachedUser();
      if (!cancelled) {
        setToken(storedToken);
        if (cachedUser) setUser(cachedUser);
      }

      try {
        const me = await getMe();
        if (!cancelled) {
          setUser(me);
          await authStorage.setCachedUser(me);
        }
      } catch (error) {
        if (isUnauthorizedError(error)) {
          await authStorage.clearSession();
          applyAuthHeader(null);
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
        }
        // Network / 5xx: keep the stored JWT (and cached profile if any).
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: token !== null,
      login,
      logout,
      refreshUser,
    }),
    [token, user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
