import { AlertCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { ApplicationWizard } from '@/components/application/ApplicationWizard'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useApplicationDraft } from '@/hooks/useApplicationDraft'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import {
  getAdminPortalDestination,
  isAdminIdentity,
} from '@/lib/auth-routing'

/**
 * Gram Sahakari applicant entry. Admins are redirected to the Admin Portal
 * before any applicant API is called.
 */
export function ApplicationPage() {
  const { t } = useTranslation()
  const { user, role, loading: authLoading } = useAuth()
  const adminBlocked = isAdminIdentity({
    role: role ?? user?.role,
    isAdmin: user?.isAdmin,
  })

  const { application, loading, error } = useApplicationDraft({
    enabled: !authLoading && !adminBlocked,
  })

  if (authLoading) {
    return <FullScreenLoader message={t('app.loading')} />
  }

  if (adminBlocked) {
    return <Navigate to={getAdminPortalDestination()} replace />
  }

  if (loading) {
    return <FullScreenLoader message={t('app.loading')} />
  }

  if (error || !application) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <div className="glass max-w-md rounded-3xl p-8 shadow-lift">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-ink">{t('app.loadErrorTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? t('app.loadErrorBody')}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            {t('app.tryAgain')}
          </Button>
        </div>
      </div>
    )
  }

  // Only DRAFT applications are editable; anything else belongs on the status page.
  if (application.status !== 'DRAFT') {
    return <Navigate to="/application/status" replace />
  }

  // Auth mobile is stored E.164 (e.g. +919876543210); prefill the bare 10 digits.
  const fallbackPhone = (user?.mobile ?? '').replace(/\D/g, '').slice(-10)

  return (
    <ApplicationWizard
      initialApplication={application}
      fallbackPhone={fallbackPhone}
    />
  )
}
