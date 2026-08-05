import { AlertCircle, Shield } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'

import { ApplicationWizard } from '@/components/application/ApplicationWizard'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useApplicationDraft } from '@/hooks/useApplicationDraft'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import { ADMIN_DASHBOARD_PATH } from '@/lib/application-entry'

/**
 * Staff (portal Admin / Team) share the same OTP login as farmers but must not
 * call applicant APIs — backend `requireFarmerApplicant` rejects them with 403.
 */
const isStaffApplicantBlocked = (role: string | null | undefined, isAdmin: boolean | undefined) =>
  Boolean(isAdmin) || role === 'ADMIN' || role === 'TEAM'

export function ApplicationPage() {
  const { t } = useTranslation()
  const { user, role, logout } = useAuth()
  const staffBlocked = isStaffApplicantBlocked(role ?? user?.role, user?.isAdmin)

  const { application, loading, error } = useApplicationDraft({
    enabled: !staffBlocked,
  })

  if (staffBlocked) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <div className="glass max-w-md rounded-3xl p-8 shadow-lift">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-forest-50">
            <Shield className="h-7 w-7 text-forest-700" />
          </div>
          <h1 className="text-xl font-bold text-ink">
            This account is an Administrator account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Administrator and Team accounts cannot submit Gram Sahakari
            applications. Use the Admin Portal for operations, or log out and
            sign in with a farmer mobile number to apply.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to={ADMIN_DASHBOARD_PATH}>Go to Admin Dashboard</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void logout().then(() => {
                  window.location.assign('/login')
                })
              }}
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    )
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
