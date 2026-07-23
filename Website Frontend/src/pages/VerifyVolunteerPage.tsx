import { ShieldCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { PageLayout } from '@/components/layout/PageLayout'
import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/LanguageProvider'
import { toVolunteerId } from '@/lib/gram-sahakari-id'

/**
 * Public verification landing — future backend lookup will hydrate volunteer
 * details here. Today it confirms the QR URL shape and shows a placeholder.
 */
export function VerifyVolunteerPage() {
  const { t } = useTranslation()
  const { volunteerId: rawId } = useParams<{ volunteerId: string }>()
  const volunteerId = rawId ? toVolunteerId(decodeURIComponent(rawId)) : ''

  return (
    <PageLayout>
      <Seo
        title={t('idCard.verifyPageTitle')}
        description={t('idCard.verifyPageDescription')}
        path={`/verify/${volunteerId || ''}`}
        noindex
      />
      <section className="section-padding flex min-h-[70vh] items-center bg-cream">
        <div className="container-wide mx-auto max-w-lg text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
            <ShieldCheck className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-ink">{t('idCard.verifyPageTitle')}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t('idCard.verifyPageBody')}
          </p>
          {volunteerId && (
            <p className="mt-6 rounded-2xl border border-forest-100 bg-white px-4 py-3 font-mono text-sm font-semibold tracking-wide text-forest-900">
              {volunteerId}
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{t('idCard.verifyPageSoon')}</p>
          <Button asChild className="mt-8" variant="outline">
            <Link to="/">{t('common.home')}</Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  )
}
