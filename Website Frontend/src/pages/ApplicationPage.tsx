import { AlertCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { ApplicationWizard } from '@/components/application/ApplicationWizard'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useApplicationDraft } from '@/hooks/useApplicationDraft'
import { useAuth } from '@/hooks/useAuth'

export function ApplicationPage() {
  const { user } = useAuth()
  const { application, loading, error } = useApplicationDraft()

  if (loading) {
    return <FullScreenLoader message="Loading your application…" />
  }

  if (error || !application) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <div className="glass max-w-md rounded-3xl p-8 shadow-lift">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? 'We could not load your application.'}
          </p>
          <Button className="mt-6" onClick={() => window.location.reload()}>
            Try Again
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
