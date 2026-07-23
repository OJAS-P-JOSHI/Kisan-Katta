import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { FullScreenLoader } from '@/components/FullScreenLoader'
import { useAuth } from '@/hooks/useAuth'

interface AdminRouteProps {
  children: ReactNode
}

/**
 * Auth + portal admin guard. Non-admins never see /admin/* content —
 * they are sent to the 403 page.
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { loading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullScreenLoader message="Restoring admin session…" />
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!user?.isAdmin) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
