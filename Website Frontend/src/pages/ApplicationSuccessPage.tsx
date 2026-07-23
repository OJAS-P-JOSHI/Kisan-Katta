import { motion } from 'framer-motion'
import { CheckCircle2, Home, ListChecks } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { getMyApplication } from '@/api/application.api'
import { BrandLogo } from '@/components/common/BrandLogo'
import { Seo } from '@/components/common/Seo'
import { GramSahakariIDCard } from '@/components/id-card'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/LanguageProvider'
import { isIDCardEligible } from '@/lib/gram-sahakari-id'
import { defaultTransition, fadeUp } from '@/lib/motion'
import type { ApplicationDTO, PaymentStatus } from '@/types/application.types'

type SuccessLocationState = {
  applicationNumber?: string
  paymentStatus?: PaymentStatus
  razorpayPaymentId?: string | null
  paidAt?: string | null
}

export function ApplicationSuccessPage() {
  const { t, locale } = useTranslation()
  const location = useLocation()
  const state = (location.state as SuccessLocationState | null) ?? null

  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationDTO | null>(null)
  const [notSubmitted, setNotSubmitted] = useState(false)

  // Prefer location.state for receipt summary, but always load full application
  // so the Digital ID has photo / address fields when eligible.
  const applicationNumber = application?.applicationNumber ?? state?.applicationNumber ?? ''
  const paymentStatus = application?.paymentStatus ?? state?.paymentStatus ?? 'PAID'
  const paymentId = application?.paymentReference ?? state?.razorpayPaymentId ?? null
  const paidAt = application?.submittedAt ?? state?.paidAt ?? null

  const formatDateTime = (iso: string | null | undefined): string => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(locale === 'mr' ? 'mr-IN' : 'en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const app = await getMyApplication()
        if (cancelled) return
        if (app.status !== 'SUBMITTED') {
          setNotSubmitted(true)
          return
        }
        setApplication(app)
      } catch {
        // If we arrived with payment success state, still show receipt without ID.
        if (!state?.applicationNumber && !cancelled) setNotSubmitted(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state?.applicationNumber])

  if (loading) {
    return <FullScreenLoader message={t('app.success.loading')} />
  }

  if (notSubmitted) {
    return <Navigate to="/application/status" replace />
  }

  const showIdCard = application ? isIDCardEligible(application) : false

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <Seo title={t('seo.success.title')} description={t('seo.success.description')} noindex />
      <div className="organic-blob absolute inset-0" aria-hidden />

      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
      </header>

      <main className="relative mx-auto w-full max-w-2xl space-y-5 px-4 py-8 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
          className="glass mx-auto max-w-lg rounded-3xl p-6 text-center shadow-lift sm:p-8"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
            <CheckCircle2 className="h-9 w-9 text-forest-700" />
          </div>

          <h1 className="text-2xl font-bold text-ink">{t('app.success.title')}</h1>
          <p className="mt-2 text-sm text-slate">{t('app.success.body')}</p>

          <dl className="mt-8 space-y-3 text-left">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t('app.success.appNumber')}</dt>
              <dd className="text-sm font-semibold text-ink">{applicationNumber || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t('app.success.paymentStatus')}</dt>
              <dd className="text-sm font-semibold text-forest-700">
                {paymentStatus === 'PAID' ? t('app.success.paid') : paymentStatus}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t('app.success.amount')}</dt>
              <dd className="text-sm font-semibold text-ink">₹500</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t('app.success.paymentId')}</dt>
              <dd className="max-w-[60%] truncate text-sm font-semibold text-ink">
                {paymentId || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">{t('app.success.dateTime')}</dt>
              <dd className="text-right text-sm font-semibold text-ink">
                {formatDateTime(paidAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/application/status">
                <ListChecks className="h-4 w-4" />
                {t('app.success.track')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="h-4 w-4" />
                {t('app.success.returnHome')}
              </Link>
            </Button>
          </div>
        </motion.div>

        {showIdCard && application && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.08 }}
            className="glass rounded-3xl p-5 shadow-lift sm:p-6"
          >
            <GramSahakariIDCard application={application} />
          </motion.div>
        )}
      </main>
    </div>
  )
}
