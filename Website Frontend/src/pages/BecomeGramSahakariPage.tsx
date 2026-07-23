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
import { PageHero } from '@/components/common/SectionTitle'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { Seo } from '@/components/common/Seo'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { Timeline } from '@/components/Timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  gramSahakariBenefits,
  gramSahakariTimelineSteps,
  villageImpactStats,
} from '@/data/gram-sahakari'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'

const benefitIcons = [Award, Heart, Users, BadgeCheck]

const requirements: { icon: typeof MapPin; textKey: TranslationKeys }[] = [
  { icon: MapPin, textKey: 'become.req.resident' },
  { icon: Smartphone, textKey: 'become.req.smartphone' },
  { icon: GraduationCap, textKey: 'become.req.education' },
  { icon: Clock, textKey: 'become.req.hours' },
  { icon: Heart, textKey: 'become.req.passion' },
]

export function BecomeGramSahakariPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo title={t('seo.become.title')} description={t('seo.become.description')} path="/become-gram-sahakari" />
      <PageHero
        title={t('become.heroTitle')}
        marathiTitle={t('become.heroMarathi')}
        subtitle={t('become.heroSubtitle')}
      >
        <Button asChild size="lg" variant="secondary">
          <ApplyLink>{t('become.startApplication')}</ApplyLink>
        </Button>
      </PageHero>

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
          >
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('become.whoTitle')}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
              {t('become.whoBody')}
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl shadow-card ring-1 ring-border/40">
              <OptimizedImage
                src={brandAssets.hero}
                alt={t('become.farmlandAlt')}
                width={1200}
                height={675}
                className="aspect-video w-full object-cover object-center"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <h2 className="mb-5 text-2xl font-bold text-ink sm:text-3xl">{t('become.benefitsTitle')}</h2>
            <div className="space-y-3">
              {gramSahakariBenefits.map((benefit, index) => {
                const Icon = benefitIcons[index] ?? Award
                return (
                  <motion.div
                    key={benefit.titleKey}
                    variants={fadeUp}
                    transition={{ ...defaultTransition, delay: index * 0.08 }}
                  >
                    <Card>
                      <CardContent className="flex gap-4 p-5 sm:p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink">{t(benefit.titleKey)}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {t(benefit.descriptionKey)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="mb-6 text-center text-2xl font-bold text-ink sm:mb-8 sm:text-3xl">
            {t('become.requirementsTitle')}
          </h2>
          <div className="mx-auto max-w-2xl space-y-3">
            {requirements.map(({ icon: Icon, textKey }) => (
              <div
                key={textKey}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-cream p-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[15px] text-slate sm:text-base">{t(textKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <h2 className="mb-8 text-center text-2xl font-bold text-ink sm:mb-10 sm:text-3xl">
            {t('become.impactTitle')}
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4">
            {villageImpactStats.map((stat) => (
              <div
                key={stat.labelKey}
                className="rounded-2xl bg-white p-5 text-center shadow-soft sm:p-6"
              >
                <p className="text-2xl font-bold text-forest-900 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="mb-8 text-center text-2xl font-bold text-ink sm:mb-10 sm:text-3xl">
            {t('become.processTitle')}
          </h2>
          <Timeline steps={gramSahakariTimelineSteps} />
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <ApplyLink>{t('become.startApplication')}</ApplyLink>
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title={t('become.ctaTitle')}
        description={t('become.ctaDescription')}
        primaryLabel={t('become.startApplication')}
        primaryHref="/application"
      />
    </PageLayout>
  )
}
