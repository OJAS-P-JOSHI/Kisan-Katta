import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'

import { getMe, logoutRequest } from '@/api/auth.api'
import { setUnauthorizedHandler } from '@/api/axios'
import { tokenService } from '@/services/token.service'
import type { AuthUser, UserRole } from '@/types/auth.types'

export type AuthContextValue = {
  /** The current JWT, or `null` when signed out. */
  token: string | null
  /** The current authenticated user from `GET /auth/me`, or `null`. */
  user: AuthUser | null
  /** The user's role from the backend, or `null` if not provided. */
  role: UserRole | null
  /** `true` only while the initial session-restore bootstrap is running. */
  loading: boolean
  /** `true` once a JWT is present. */
  isAuthenticated: boolean
  /** Persists the token, then refreshes `user`. Returns the user when available. */
  login: (newToken: string) => Promise<AuthUser | null>
  /** Clears the token and resets state (calls the backend logout endpoint). */
  logout: () => Promise<{ remoteOk: boolean }>
  /** Re-fetches `GET /auth/me`. Auto-logs-out on a 401. */
  refreshUser: () => Promise<AuthUser | null>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback((): void => {
    tokenService.clearToken()
    setToken(null)
    setUser(null)
  }, [])

  const logout = useCallback(async (): Promise<{ remoteOk: boolean }> => {
    let remoteOk = true
    try {
      remoteOk = await logoutRequest()
    } finally {
      // Always clear local auth — network failures / expired sessions must not
      // leave a stale JWT in storage.
      clearSession()
    }
    return { remoteOk }
  }, [clearSession])

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const me = await getMe()
      setUser(me)
      return me
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response
        ?.status
      if (status === 401) {
        clearSession()
      }
      return null
    }
  }, [clearSession])

  const login = useCallback(
    async (newToken: string): Promise<AuthUser | null> => {
      tokenService.setToken(newToken)
      setToken(newToken)
      return refreshUser()
    },
    [refreshUser],
  )

  // Register the interceptor's 401 handler so an expired session anywhere in
  // the app clears local auth state. Kept in a ref-free effect so `logout`
  // always sees the latest closures.
  const clearSessionRef = useRef(clearSession)
  clearSessionRef.current = clearSession
  useEffect(() => {
    setUnauthorizedHandler(() => clearSessionRef.current())
    return () => setUnauthorizedHandler(null)
  }, [])

  // Session restore: read stored token, then fetch the user once on mount.
  useEffect(() => {
    let cancelled = false

    const bootstrap = async (): Promise<void> => {
      const storedToken = tokenService.getToken()

      if (!storedToken) {
        if (!cancelled) setLoading(false)
        return
      }

      if (!cancelled) setToken(storedToken)

      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        tokenService.clearToken()
        if (!cancelled) setToken(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      role: user?.role ?? null,
      loading,
      isAuthenticated: token !== null,
      login,
      logout,
      refreshUser,
    }),
    [token, user, loading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
