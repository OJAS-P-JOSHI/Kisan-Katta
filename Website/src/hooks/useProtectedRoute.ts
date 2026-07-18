import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'

/**
 * Redirects unauthenticated users to `/login` once the session-restore
 * bootstrap has finished. Preserves the attempted location so the login flow
 * can send the user back after authenticating.
 */
export function useProtectedRoute(): { loading: boolean; isAuthenticated: boolean } {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [loading, isAuthenticated, navigate, location.pathname])

  return { loading, isAuthenticated }
}
