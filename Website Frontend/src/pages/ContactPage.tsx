import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'

import { PageIntro } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { contactInfo } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { fadeUp, defaultTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function ContactPage() {
  const { t, locale } = useTranslation()
  const marathi = locale === 'mr'

  return (
    <PageLayout>
      <Seo
        title={t('seo.contact.title')}
        description={t('seo.contact.description')}
        path="/contact"
      />
      <PageIntro
        kicker={t('contact.getInTouch')}
        title={t('contact.heroTitle')}
        marathiTitle={t('contact.heroMarathi')}
        subtitle={t('contact.heroSubtitle')}
      />

      <section className="section-padding !pt-8 bg-cream">
        <div className="container-wide grid min-w-0 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
            className="space-y-4"
          >
            <a
              href={`tel:${contactInfo.phoneHref}`}
              className="flex min-h-16 items-start gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-soft transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className={cn('block font-medium text-ink', marathi && 'font-marathi')}>
                  {t('contact.phone')}
                </span>
                <span className="mt-0.5 block text-lg font-semibold text-forest-900">
                  {contactInfo.phone}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${contactInfo.email}`}
              className="flex min-h-16 items-start gap-4 rounded-2xl border border-border/60 bg-white p-5 shadow-soft transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                <Mail className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className={cn('block font-medium text-ink', marathi && 'font-marathi')}>
                  {t('contact.email')}
                </span>
                <span className="mt-0.5 block break-all text-forest-900">{contactInfo.email}</span>
              </span>
            </a>

            <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-white p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className={cn('font-medium text-ink', marathi && 'font-marathi')}>
                  {t('contact.address')}
                </p>
                <address className="mt-1 not-italic leading-relaxed text-muted-foreground">
                  {contactInfo.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-white p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                <Clock className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className={cn('font-medium text-ink', marathi && 'font-marathi')}>
                  {t('contact.hours')}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {t(contactInfo.hours.daysKey)}
                  <br />
                  {t(contactInfo.hours.timeKey)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.08 }}
            className="rounded-3xl bg-forest-900 p-7 text-white sm:p-8"
          >
            <h2 className={cn('text-xl font-semibold', marathi && 'font-marathi')}>
              {t('contact.getInTouch')}
            </h2>
            <p className={cn('mt-3 leading-relaxed text-white/75', marathi && 'font-marathi')}>
              {t('contact.getInTouchBody')}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild size="lg" variant="glow" className="w-full">
                <a href={`tel:${contactInfo.phoneHref}`}>
                  <Phone className="h-5 w-5" />
                  {t('contact.callUs')}
                </a>
              </Button>
              <Button asChild size="lg" variant="glass" className="w-full">
                <a href={`mailto:${contactInfo.email}`}>
                  <Mail className="h-5 w-5" />
                  {t('contact.emailUs')}
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
