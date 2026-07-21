import { motion } from 'framer-motion'
import { CheckCircle2, Home, ListChecks } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'

import { getMyApplication } from '@/api/application.api'
import { BrandLogo } from '@/components/common/BrandLogo'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { defaultTransition, fadeUp } from '@/lib/motion'
import type { PaymentStatus } from '@/types/application.types'

type SuccessLocationState = {
  applicationNumber?: string
  paymentStatus?: PaymentStatus
  razorpayPaymentId?: string | null
  paidAt?: string | null
}

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ApplicationSuccessPage() {
  const location = useLocation()
  const state = (location.state as SuccessLocationState | null) ?? null

  const [loading, setLoading] = useState(!state?.applicationNumber)
  const [applicationNumber, setApplicationNumber] = useState(state?.applicationNumber ?? '')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    state?.paymentStatus ?? 'PAID',
  )
  const [paymentId, setPaymentId] = useState(state?.razorpayPaymentId ?? null)
  const [paidAt, setPaidAt] = useState(state?.paidAt ?? null)
  const [notSubmitted, setNotSubmitted] = useState(false)

  useEffect(() => {
    if (state?.applicationNumber) return

    let cancelled = false
    ;(async () => {
      try {
        const app = await getMyApplication()
        if (cancelled) return
        if (app.status !== 'SUBMITTED') {
          setNotSubmitted(true)
          return
        }
        setApplicationNumber(app.applicationNumber)
        setPaymentStatus(app.paymentStatus)
        setPaymentId(app.paymentReference)
        setPaidAt(app.submittedAt)
      } catch {
        if (!cancelled) setNotSubmitted(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [state?.applicationNumber])

  if (loading) {
    return <FullScreenLoader message="Loading confirmation…" />
  }

  if (notSubmitted) {
    return <Navigate to="/application/status" replace />
  }

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="organic-blob absolute inset-0" aria-hidden />

      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
      </header>

      <main className="relative mx-auto w-full max-w-lg px-4 py-8 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
          className="glass rounded-3xl p-6 text-center shadow-lift sm:p-8"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50">
            <CheckCircle2 className="h-9 w-9 text-forest-700" />
          </div>

          <h1 className="text-2xl font-bold text-ink">🎉 Application Submitted</h1>
          <p className="mt-2 text-sm text-slate">
            Your Gram Sahakari registration has been submitted successfully.
          </p>

          <dl className="mt-8 space-y-3 text-left">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">Application Number</dt>
              <dd className="text-sm font-semibold text-ink">{applicationNumber || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">Payment Status</dt>
              <dd className="text-sm font-semibold text-forest-700">
                {paymentStatus === 'PAID' ? 'Paid' : paymentStatus}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">Amount</dt>
              <dd className="text-sm font-semibold text-ink">₹500</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">Payment ID</dt>
              <dd className="max-w-[60%] truncate text-sm font-semibold text-ink">
                {paymentId || '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
              <dt className="text-xs text-muted-foreground">Date & Time</dt>
              <dd className="text-right text-sm font-semibold text-ink">
                {formatDateTime(paidAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/application/status">
                <ListChecks className="h-4 w-4" />
                Track Application
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return Home
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
