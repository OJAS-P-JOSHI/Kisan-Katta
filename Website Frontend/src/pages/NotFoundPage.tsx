import { ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/LanguageProvider'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo
        title={t('seo.notFound.title')}
        description={t('seo.notFound.description')}
        noindex
      />
      <section className="section-padding flex min-h-[70vh] items-center bg-cream">
        <div className="container-wide mx-auto max-w-xl text-center">
          <p className="text-7xl font-bold text-forest-900 sm:text-8xl">404</p>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">{t('notFound.title')}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t('notFound.body')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-5 w-5" />
                {t('notFound.backHome')}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">
                <ArrowLeft className="h-5 w-5" />
                {t('notFound.contactSupport')}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
