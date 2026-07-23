import axios from 'axios'
import { motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { getMyApplication } from '@/api/application.api'
import { BrandLogo } from '@/components/common/BrandLogo'
import { LogoutButton } from '@/components/common/LogoutButton'
import { Seo } from '@/components/common/Seo'
import { GramSahakariIDCard } from '@/components/id-card'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import { isIDCardEligible } from '@/lib/gram-sahakari-id'
import { defaultTransition, fadeUp } from '@/lib/motion'
import type { ApplicationDTO } from '@/types/application.types'

function AuthenticatedShell({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      <div className="organic-blob pointer-events-none absolute inset-0" aria-hidden />
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo size="md" />
        <div className="flex items-center gap-3">
          {user?.mobile && (
            <span className="hidden rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft sm:inline">
              {user.mobile}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
          className="w-full max-w-lg space-y-5"
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}

/**
 * Profile shell — ready to host the reusable Digital ID when the volunteer
 * is SUBMITTED + PAID. Other profile features remain forthcoming.
 */
export function ProfilePage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<ApplicationDTO | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const app = await getMyApplication()
        if (!cancelled) setApplication(app)
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          if (!cancelled) setApplication(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <FullScreenLoader message={t('common.loading')} />
  }

  const showId = isIDCardEligible(application)

  return (
    <AuthenticatedShell>
      <Seo title={t('seo.profile.title')} description={t('seo.profile.description')} noindex />
      <div className="glass rounded-3xl p-8 text-center shadow-lift">
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t('app.profile.title')}</h1>
        <p className="font-marathi mt-1 text-sm text-forest-700">{t('app.profile.marathi')}</p>
        {!showId && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {t('app.profile.comingSoon')}
          </p>
        )}
        <Link
          to="/application"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-forest-700 transition-colors hover:bg-forest-50 hover:text-forest-900"
        >
          ← {t('app.profile.backToApp')}
        </Link>
      </div>

      {showId && application && (
        <div className="glass rounded-3xl p-5 text-left shadow-lift sm:p-6">
          <GramSahakariIDCard application={application} />
        </div>
      )}
    </AuthenticatedShell>
  )
}
