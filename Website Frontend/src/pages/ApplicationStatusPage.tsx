import axios from 'axios'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  FileEdit,
  Home,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { getApplicationStatus, getMyApplication } from '@/api/application.api'
import { StatusBadge } from '@/components/application/StatusBadge'
import { StatusTimeline } from '@/components/application/StatusTimeline'
import { BrandLogo } from '@/components/common/BrandLogo'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useApplicationPayment } from '@/hooks/useApplicationPayment'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/api-error'
import { paymentDebug } from '@/lib/payment-debug'
import { defaultTransition, fadeUp } from '@/lib/motion'
import type { ApplicationDTO, ApplicationStatusDTO } from '@/types/application.types'

type Data = { application: ApplicationDTO; status: ApplicationStatusDTO }

const formatDateTime = (iso: string | null): string | null => {
  if (!iso) return null
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_MESSAGE: Record<ApplicationDTO['status'], string> = {
  DRAFT: 'Your application is still a draft. Continue editing to complete it.',
  PAYMENT_PENDING: 'Application is ready for payment.',
  SUBMITTED: 'Application has already been submitted.',
}

export function ApplicationStatusPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const payment = useApplicationPayment({
    name: data?.application.fullName ?? undefined,
    contact: data?.application.phone ?? undefined,
    email: data?.application.email ?? undefined,
  })

  const fetchData = useCallback(async () => {
    const [application, status] = await Promise.all([
      getMyApplication(),
      getApplicationStatus(),
    ])
    setData({ application, status })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await fetchData()
      } catch (err) {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setNotFound(true)
        } else {
          setError(getErrorMessage(err, 'Unable to load your application status.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchData()
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to refresh status.'))
    } finally {
      setRefreshing(false)
    }
  }, [fetchData])

  const handleLogout = useCallback(async () => {
    await logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const handleRetryPayment = useCallback(async () => {
    if (data?.application) {
      paymentDebug('User clicked Retry Payment', {
        applicationId: data.application.id,
        applicationNumber: data.application.applicationNumber,
        currentPaymentStatus: data.application.paymentStatus,
        currentStatus: data.application.status,
      })
    }
    await payment.retryPayment()
    // After dismiss/fail, refresh so badges stay in sync with backend.
    try {
      await fetchData()
    } catch {
      /* ignore — payment hook surfaces its own error */
    }
  }, [fetchData, payment])

  if (loading) {
    return <FullScreenLoader message="Loading application status…" />
  }

  if (notFound) {
    return <Navigate to="/application" replace />
  }

  if (data && data.application.status === 'DRAFT') {
    return <Navigate to="/application" replace />
  }

  const application = data?.application
  const status = data?.status
  const isPaymentPending = status?.status === 'PAYMENT_PENDING'
  const isSubmitted = status?.status === 'SUBMITTED'

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="organic-blob absolute inset-0" aria-hidden />

      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
        <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </header>

      <main className="relative mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {(error || payment.error) && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error || payment.error}
          </p>
        )}

        {application && status && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={defaultTransition}
            className="space-y-5"
          >
            <div className="glass rounded-3xl p-6 shadow-lift sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-ink sm:text-2xl">Application Status</h1>
                  <p className="font-marathi text-sm text-forest-700">अर्जाची स्थिती</p>
                  {application.applicationNumber && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Application No.{' '}
                      <span className="font-semibold text-ink">{application.applicationNumber}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing || payment.busy}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-50 disabled:opacity-60"
                >
                  <RefreshCw className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                  Refresh
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusBadge kind="application" status={status.status} />
                <StatusBadge kind="payment" status={status.paymentStatus} />
              </div>

              <p className="mt-4 text-sm text-slate">{STATUS_MESSAGE[status.status]}</p>

              {isPaymentPending && (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
                  <p className="text-sm font-semibold text-orange-800">
                    Application is ready for payment.
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    Complete the ₹500 registration fee to submit your application. Editing is
                    disabled until payment succeeds or you return later to retry.
                  </p>
                  {payment.loadingLabel && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {payment.loadingLabel}
                    </p>
                  )}
                  {payment.phase === 'failed' && (
                    <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-red-600">
                      <p className="font-semibold">Payment not completed.</p>
                      <p className="mt-0.5 font-normal">
                        Your application has been saved. You can retry payment anytime.
                      </p>
                    </div>
                  )}
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    type="button"
                    onClick={() => void handleRetryPayment()}
                    disabled={payment.busy}
                  >
                    {payment.busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Please wait…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {payment.phase === 'failed' ? 'Retry Payment' : 'Pay ₹500'}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isSubmitted && (
                <div className="mt-5 rounded-2xl border border-forest-100 bg-forest-50/70 p-4">
                  <p className="text-sm font-semibold text-forest-800">
                    Application has already been submitted.
                  </p>
                  <p className="mt-1 text-sm text-forest-700">
                    Editing is disabled. You can track your application below.
                  </p>
                </div>
              )}

              {formatDateTime(application.submittedAt) && (
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-forest-700" />
                  Submitted on {formatDateTime(application.submittedAt)}
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6 shadow-card sm:p-8">
              <h2 className="mb-5 text-base font-bold text-ink">Progress Timeline</h2>
              <StatusTimeline application={application} />
            </div>

            <div className="flex flex-wrap gap-3">
              {isSubmitted && (
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    Return Home
                  </Link>
                </Button>
              )}
              {!isSubmitted && !isPaymentPending && (
                <Button asChild variant="outline">
                  <Link to="/application">
                    <FileEdit className="h-4 w-4" />
                    Continue Editing
                  </Link>
                </Button>
              )}
            </div>

            {payment.phase === 'failed' && !isPaymentPending && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                Something went wrong with payment. Please refresh and try again.
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
