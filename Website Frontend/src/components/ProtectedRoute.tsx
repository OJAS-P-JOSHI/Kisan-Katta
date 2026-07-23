import type { ReactNode } from 'react'

import { FullScreenLoader } from '@/components/FullScreenLoader'
import { useProtectedRoute } from '@/hooks/useProtectedRoute'
import { useTranslation } from '@/i18n/LanguageProvider'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Guards protected routes. While the session is being restored a branded
 * loader is shown; unauthenticated users are redirected to `/login` (handled
 * inside `useProtectedRoute`).
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const { loading, isAuthenticated } = useProtectedRoute()

  if (loading) {
    return <FullScreenLoader message={t('app.protected.restoring')} />
  }

  if (!isAuthenticated) {
    // Redirect is triggered by the hook; render the loader meanwhile.
    return <FullScreenLoader message={t('app.protected.redirecting')} />
  }

  return <>{children}</>
}
