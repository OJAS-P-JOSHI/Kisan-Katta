import { motion } from 'framer-motion'
import {
  Award,
  BadgeCheck,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Smartphone,
  Users,
} from 'lucide-react'

import { ApplyLink } from '@/components/ApplyLink'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { PageIntro } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { Timeline } from '@/components/Timeline'
import { Button } from '@/components/ui/button'
import { gramSahakariBenefits, gramSahakariTimelineSteps } from '@/data/gram-sahakari'
import { brandAssets } from '@/data/images'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { APPLICATION_ENTRY_PATH } from '@/lib/application-entry'
import { getApplicantEntryPath } from '@/lib/auth-routing'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

const benefitIcons = [Award, Heart, Users, BadgeCheck]

const requirements: { icon: typeof MapPin; textKey: TranslationKeys }[] = [
  { icon: MapPin, textKey: 'become.req.resident' },
  { icon: Smartphone, textKey: 'become.req.smartphone' },
  { icon: GraduationCap, textKey: 'become.req.education' },
  { icon: Clock, textKey: 'become.req.hours' },
  { icon: Heart, textKey: 'become.req.passion' },
]

export function BecomeGramSahakariPage() {
  const { t, locale } = useTranslation()
  const { user, isAuthenticated } = useAuth()
  const applyHref = isAuthenticated
    ? getApplicantEntryPath(user)
    : APPLICATION_ENTRY_PATH
  const marathi = locale === 'mr'

  return (
    <PageLayout>
      <Seo title={t('seo.become.title')} description={t('seo.become.description')} path="/become-gram-sahakari" />
      <PageIntro
        kicker={t('section.gramSahakari.eyebrow')}
        title={t('become.heroTitle')}
        marathiTitle={t('become.heroMarathi')}
        subtitle={t('become.heroSubtitle')}
      >
        <Button asChild size="lg" className="w-full sm:w-auto">
          <ApplyLink>{t('become.startApplication')}</ApplyLink>
        </Button>
      </PageIntro>

      <section className="section-padding !pt-10 bg-cream">
        <div className="container-wide grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
            className="min-w-0"
          >
            <h2 className={cn('text-2xl font-bold text-ink sm:text-3xl', marathi && 'font-marathi')}>
              {t('become.whoTitle')}
            </h2>
            <p
              className={cn(
                'mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-lg',
                marathi && 'font-marathi',
              )}
            >
              {t('become.whoBody')}
            </p>
            <div className="mt-6 w-full min-w-0 overflow-hidden rounded-3xl shadow-card ring-1 ring-border/40">
              <OptimizedImage
                src={brandAssets.gramSahakari}
                alt={t('gram.imageAlt')}
                width={800}
                height={1000}
                className="aspect-[4/5] h-auto w-full object-cover object-top sm:aspect-video sm:object-center"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="min-w-0"
          >
            <h2
              className={cn(
                'mb-5 text-2xl font-bold text-ink sm:text-3xl',
                marathi && 'font-marathi',
              )}
            >
              {t('become.benefitsTitle')}
            </h2>
            <div className="space-y-3">
              {gramSahakariBenefits.map((benefit, index) => {
                const Icon = benefitIcons[index] ?? Award
                return (
                  <motion.div
                    key={benefit.titleKey}
                    variants={fadeUp}
                    transition={{ ...defaultTransition, delay: index * 0.06 }}
                    className="flex gap-4 rounded-2xl border border-border/50 bg-white p-5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <h3 className={cn('font-semibold text-ink', marathi && 'font-marathi')}>
                        {t(benefit.titleKey)}
                      </h3>
                      <p
                        className={cn(
                          'mt-1 text-sm leading-relaxed text-muted-foreground',
                          marathi && 'font-marathi',
                        )}
                      >
                        {t(benefit.descriptionKey)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2
            className={cn(
              'mb-6 text-center text-2xl font-bold text-ink sm:mb-8 sm:text-3xl',
              marathi && 'font-marathi',
            )}
          >
            {t('become.requirementsTitle')}
          </h2>
          <div className="mx-auto max-w-2xl space-y-3">
            {requirements.map(({ icon: Icon, textKey }) => (
              <div
                key={textKey}
                className="flex items-center gap-4 rounded-2xl border border-border/50 bg-cream p-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className={cn('text-[15px] text-slate sm:text-base', marathi && 'font-marathi')}>
                  {t(textKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <h2
            className={cn(
              'mb-8 text-center text-2xl font-bold text-ink sm:mb-10 sm:text-3xl',
              marathi && 'font-marathi',
            )}
          >
            {t('become.processTitle')}
          </h2>
          <Timeline steps={gramSahakariTimelineSteps} />
          <div className="mt-10">
            <Button asChild size="lg" className="w-full sm:mx-auto sm:flex sm:w-auto">
              <ApplyLink>{t('become.startApplication')}</ApplyLink>
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title={t('become.ctaTitle')}
        description={t('become.ctaDescription')}
        primaryLabel={t('become.startApplication')}
        primaryHref={applyHref}
      />
    </PageLayout>
  )
}
