import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, Phone, Send } from 'lucide-react'

import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { contactInfo } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { fadeUp, defaultTransition } from '@/lib/motion'

export function ContactPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo
        title={t('seo.contact.title')}
        description={t('seo.contact.description')}
        path="/contact"
      />
      <PageHero
        title={t('contact.heroTitle')}
        marathiTitle={t('contact.heroMarathi')}
        subtitle={t('contact.heroSubtitle')}
      />

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-ink">{t('contact.getInTouch')}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {t('contact.getInTouchBody')}
              </p>
            </div>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">{t('contact.address')}</p>
                  <address className="mt-0.5 not-italic leading-relaxed text-muted-foreground">
                    {contactInfo.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Phone className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">{t('contact.phone')}</p>
                  <a
                    href={`tel:${contactInfo.phoneHref}`}
                    className="text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Mail className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">{t('contact.email')}</p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="break-all text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">{t('contact.hours')}</p>
                  <p className="text-muted-foreground">
                    {t(contactInfo.hours.daysKey)}
                    <br />
                    {t(contactInfo.hours.timeKey)}
                  </p>
                </div>
              </li>
            </ul>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-card">
              <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 bg-forest-50 text-center text-forest-700">
                <MapPin className="h-8 w-8" aria-hidden />
                <p className="font-medium">Google Maps</p>
                <p className="max-w-xs px-4 text-sm text-forest-700/80">
                  {t('common.comingSoon')} — Paithan, Chhatrapati Sambhajinagar, Maharashtra.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.1 }}
          >
            <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-card">
              <div className="py-6 text-center sm:py-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                  <Send className="h-7 w-7" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold text-ink">{t('contact.formTitle')}</h3>
                <p className="mt-2 text-muted-foreground">{t('contact.formComingSoonNote')}</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild size="lg">
                    <a href={`tel:${contactInfo.phoneHref}`}>
                      <Phone className="h-5 w-5" />
                      {t('contact.callUs')}
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href={`mailto:${contactInfo.email}`}>
                      <Mail className="h-5 w-5" />
                      {t('contact.emailUs')}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
