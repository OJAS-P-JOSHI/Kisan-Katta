import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  HandHeart,
  MapPin,
  Smartphone,
  Sprout,
  Users,
  Wifi,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { OptimizedImage } from '@/components/common/OptimizedImage'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  gramSahakariBenefits,
  gramSahakariResponsibilities,
  villageImpactStats,
} from '@/data/gram-sahakari'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'

const responsibilityIcons = [Smartphone, HandHeart, Sprout, Wifi, Users]

export function GramSahakariSection() {
  const { t } = useTranslation()

  return (
    <section id="gram-sahakari" className="section-padding relative overflow-hidden bg-cream">
      <div className="organic-blob pointer-events-none absolute inset-0" />
      <div className="container-wide relative">
        <SectionTitle
          eyebrow={t('section.gramSahakari.eyebrow')}
          title={t('section.gramSahakari.title')}
          marathiTitle="ग्राम सहकारी बना"
          subtitle={t('section.gramSahakari.subtitle')}
        />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={defaultTransition}
            className="space-y-6"
          >
            <Card className="border-forest-100/80 bg-white shadow-card">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl font-bold text-ink sm:text-2xl">
                  {t('section.gramSahakari.whoTitle')}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                  {t('section.gramSahakari.whoBody')}
                </p>
              </CardContent>
            </Card>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-700">
                {t('section.gramSahakari.responsibilitiesTitle')}
              </h4>
              <ul className="space-y-3">
                {gramSahakariResponsibilities.map((item, i) => {
                  const Icon = responsibilityIcons[i] ?? Users
                  return (
                    <li key={item.textKey} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-soft">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="pt-2 text-[15px] text-slate">{t(item.textKey)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-forest-700">
                {t('section.gramSahakari.benefitsTitle')}
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {gramSahakariBenefits.map((benefit) => (
                  <div
                    key={benefit.titleKey}
                    className="rounded-2xl border border-gold-100 bg-gold-100/40 p-4"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-white">
                      <Award className="h-4 w-4" />
                    </div>
                    <p className="font-semibold text-ink">{t(benefit.titleKey)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t(benefit.descriptionKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.12 }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-forest-900/5">
              <OptimizedImage
                src={brandAssets.gramSahakari}
                alt={t('gram.imageAlt')}
                width={800}
                height={1000}
                className="aspect-[4/5] w-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/75 via-forest-900/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                <p className="font-marathi text-lg sm:text-xl">{t('gram.overlay')}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                  {t('section.gramSahakari.subtitle')}
                </p>
              </div>
            </div>

            <Card className="border-forest-100 bg-white shadow-card">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gold-500" />
                  <h4 className="font-bold text-ink">{t('section.gramSahakari.impactTitle')}</h4>
                </div>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="grid grid-cols-3 gap-3"
                >
                  {villageImpactStats.map((stat) => (
                    <motion.div
                      key={stat.labelKey}
                      variants={fadeUp}
                      className="rounded-2xl bg-forest-50 px-3 py-4 text-center"
                    >
                      <p className="text-xl font-bold text-forest-900 sm:text-2xl">{stat.value}</p>
                      <p className="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                        {t(stat.labelKey)}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>

            <Button asChild size="lg" className="w-full">
              <Link to="/become-gram-sahakari">
                {t('section.gramSahakari.apply')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
