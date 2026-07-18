import axios from 'axios'
import { motion } from 'framer-motion'
import { CalendarClock, LogOut, MessageSquareText, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { getApplicationStatus, getMyApplication } from '@/api/application.api'
import { StatusBadge } from '@/components/application/StatusBadge'
import { StatusTimeline } from '@/components/application/StatusTimeline'
import { BrandLogo } from '@/components/common/BrandLogo'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/api-error'
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
  DRAFT: 'Your application is still a draft.',
  SUBMITTED: 'Your application has been submitted and is awaiting review.',
  UNDER_REVIEW: 'Our team is currently reviewing your application.',
  APPROVED: 'Congratulations! Your application has been approved.',
  REJECTED: 'Unfortunately, your application was not approved.',
  ACTIVE: 'You are an active Gram Sahakari. Welcome aboard!',
  SUSPENDED: 'Your Gram Sahakari account is currently suspended.',
}

export function ApplicationStatusPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    // GET /me provides dates + full detail; GET /status is the authoritative
    // lightweight status. Both are consumed here.
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
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
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
                </div>
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
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

              {formatDateTime(application.submittedAt) && (
                <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4 text-forest-700" />
                  Submitted on {formatDateTime(application.submittedAt)}
                </div>
              )}

              {status.reviewRemarks && (
                <div className="mt-4 rounded-2xl border border-border bg-white/70 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <MessageSquareText className="h-4 w-4 text-forest-700" />
                    Remarks
                  </p>
                  <p className="mt-1 text-sm text-slate">{status.reviewRemarks}</p>
                </div>
              )}
            </div>

            <div className="glass rounded-3xl p-6 shadow-card sm:p-8">
              <h2 className="mb-5 text-base font-bold text-ink">Progress Timeline</h2>
              <StatusTimeline application={application} />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
