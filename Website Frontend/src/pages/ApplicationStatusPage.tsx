import axios from 'axios'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  Home,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { getApplicationStatus, getMyApplication } from '@/api/application.api'
import { StatusBadge } from '@/components/application/StatusBadge'
import { StatusTimeline } from '@/components/application/StatusTimeline'
import { BrandLogo } from '@/components/common/BrandLogo'
import { LogoutButton } from '@/components/common/LogoutButton'
import { Seo } from '@/components/common/Seo'
import { GramSahakariIDCard } from '@/components/id-card'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useApplicationPayment } from '@/hooks/useApplicationPayment'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { getErrorMessage } from '@/lib/api-error'
import { paymentDebug } from '@/lib/payment-debug'
import { defaultTransition, fadeUp } from '@/lib/motion'
import type { ApplicationDTO, ApplicationStatusDTO } from '@/types/application.types'

type Data = { application: ApplicationDTO; status: ApplicationStatusDTO }

const STATUS_MESSAGE_KEYS: Record<ApplicationDTO['status'], TranslationKeys> = {
  DRAFT: 'app.status.msg.DRAFT',
  PAYMENT_PENDING: 'app.status.msg.PAYMENT_PENDING',
  SUBMITTED: 'app.status.msg.SUBMITTED',
}

export function ApplicationStatusPage() {
  const { t, locale } = useTranslation()
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

  const formatDateTime = useCallback(
    (iso: string | null): string | null => {
      if (!iso) return null
      return new Date(iso).toLocaleString(locale === 'mr' ? 'mr-IN' : 'en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    [locale],
  )

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
          setError(getErrorMessage(err, t('app.loadErrorBody')))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchData, t])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await fetchData()
      setError(null)
      setNotFound(false)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setNotFound(true)
        setError(null)
      } else {
        setError(getErrorMessage(err, t('app.loadErrorBody')))
      }
    } finally {
      setRefreshing(false)
    }
  }, [fetchData, t])

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
  }, [data?.application, fetchData, payment])

  if (loading) {
    return <FullScreenLoader message={t('app.status.loading')} />
  }

  if (notFound) {
    return <Navigate to="/application" replace />
  }

  if (data && data.application.status === 'DRAFT') {
    return <Navigate to="/application" replace />
  }

  if (!data && error) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
        <Seo title={t('seo.status.title')} description={t('seo.status.description')} noindex />
        <div className="glass max-w-md rounded-3xl p-8 shadow-lift">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-ink">{t('app.loadErrorTitle')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6" onClick={() => void handleRefresh()} disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.pleaseWait')}
              </>
            ) : (
              t('app.tryAgain')
            )}
          </Button>
        </div>
      </div>
    )
  }

  const application = data?.application
  const status = data?.status
  const isPaymentPending = status?.status === 'PAYMENT_PENDING'
  const isSubmitted = status?.status === 'SUBMITTED'
  const submittedAt = formatDateTime(application?.submittedAt ?? null)

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <Seo title={t('seo.status.title')} description={t('seo.status.description')} noindex />
      <div className="organic-blob absolute inset-0" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
        <LogoutButton />
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
                  <h1 className="text-xl font-bold text-ink sm:text-2xl">{t('app.status.title')}</h1>
                  <p className="font-marathi text-sm text-forest-700">{t('app.status.marathi')}</p>
                  {application.applicationNumber && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('app.status.appNo')}{' '}
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
                  {t('app.status.refresh')}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusBadge kind="application" status={status.status} />
                <StatusBadge kind="payment" status={status.paymentStatus} />
              </div>

              <p className="mt-4 text-sm text-slate">{t(STATUS_MESSAGE_KEYS[status.status])}</p>

              {isPaymentPending && (
                <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
                  <p className="text-sm font-semibold text-orange-800">
                    {t('app.status.paymentReadyTitle')}
                  </p>
                  <p className="mt-1 text-sm text-orange-700">{t('app.status.paymentReadyBody')}</p>
                  {payment.loadingLabel && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-blue-700">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {payment.loadingLabel}
                    </p>
                  )}
                  {payment.phase === 'failed' && (
                    <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-red-600">
                      <p className="font-semibold">{t('app.status.paymentNotCompletedTitle')}</p>
                      <p className="mt-0.5 font-normal">{t('app.status.paymentNotCompletedBody')}</p>
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
                        {t('app.status.pleaseWait')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        {payment.phase === 'failed'
                          ? t('app.status.retryPayment')
                          : t('app.status.payAmount', { amount: 500 })}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isSubmitted && (
                <div className="mt-5 rounded-2xl border border-forest-100 bg-forest-50/70 p-4">
                  <p className="text-sm font-semibold text-forest-800">
                    {t('app.status.submittedTitle')}
                  </p>
                  <p className="mt-1 text-sm text-forest-700">{t('app.status.submittedBody')}</p>
                </div>
              )}

              {submittedAt && (
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-forest-700" />
                  {t('app.status.submittedOn', { date: submittedAt })}
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6 shadow-card sm:p-8">
              <h2 className="mb-5 text-base font-bold text-ink">{t('app.status.timelineTitle')}</h2>
              <StatusTimeline application={application} />
            </div>

            {isSubmitted && application.paymentStatus === 'PAID' && (
              <div className="glass rounded-3xl p-5 shadow-lift sm:p-6">
                <GramSahakariIDCard application={application} />
              </div>
            )}

            {isSubmitted && (
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="h-4 w-4" />
                    {t('app.status.returnHome')}
                  </Link>
                </Button>
              </div>
            )}

            {payment.phase === 'failed' && !isPaymentPending && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {t('app.status.paymentError')}
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
