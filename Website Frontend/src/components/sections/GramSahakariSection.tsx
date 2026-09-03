import { motion } from 'framer-motion'
import { ArrowRight, Clock, Heart, MapPin, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

import { OptimizedImage } from '@/components/common/OptimizedImage'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Button } from '@/components/ui/button'
import { gramSahakariBenefits } from '@/data/gram-sahakari'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { defaultTransition, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

const requirements: { icon: typeof MapPin; textKey: TranslationKeys }[] = [
  { icon: MapPin, textKey: 'become.req.resident' },
  { icon: Smartphone, textKey: 'become.req.smartphone' },
  { icon: Clock, textKey: 'become.req.hours' },
  { icon: Heart, textKey: 'become.req.passion' },
]

export function GramSahakariSection() {
  const { t, locale } = useTranslation()
  const marathi = locale === 'mr'

  return (
    <section id="gram-sahakari" className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.gramSahakari.eyebrow')}
          title={t('section.gramSahakari.title')}
          marathiTitle="गाव प्रतिनिधी बना"
          subtitle={t('section.gramSahakari.subtitle')}
        />

        <div className="grid min-w-0 items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={defaultTransition}
            className="min-w-0 w-full"
          >
            <div className="relative w-full min-w-0 overflow-hidden rounded-3xl shadow-card ring-1 ring-forest-900/5">
              <OptimizedImage
                src={brandAssets.gramSahakari}
                alt={t('gram.imageAlt')}
                width={800}
                height={1000}
                className="aspect-[4/5] h-auto w-full object-cover object-top sm:aspect-[5/4] lg:aspect-[4/5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 via-forest-900/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-7">
                <p className="font-marathi text-lg sm:text-xl">{t('gram.overlay')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.08 }}
            className="min-w-0 space-y-8"
          >
            <div>
              <h3
                className={cn(
                  'text-xl font-bold tracking-tight text-ink sm:text-2xl',
                  marathi && 'font-marathi',
                )}
              >
                {t('section.gramSahakari.whoTitle')}
              </h3>
              <p
                className={cn(
                  'mt-3 text-[15px] leading-relaxed text-muted-foreground',
                  marathi && 'font-marathi',
                )}
              >
                {t('section.gramSahakari.whoBody')}
              </p>
            </div>

            <div>
              <h4
                className={cn(
                  'text-sm font-semibold uppercase tracking-wider text-forest-700',
                  marathi && 'font-marathi',
                )}
              >
                {t('section.gramSahakari.benefitsTitle')}
              </h4>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {gramSahakariBenefits.map((benefit) => (
                  <li
                    key={benefit.titleKey}
                    className="rounded-2xl border border-border/50 bg-cream px-4 py-4"
                  >
                    <p className={cn('font-semibold text-ink', marathi && 'font-marathi')}>
                      {t(benefit.titleKey)}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-sm leading-relaxed text-muted-foreground',
                        marathi && 'font-marathi',
                      )}
                    >
                      {t(benefit.descriptionKey)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className={cn(
                  'text-sm font-semibold uppercase tracking-wider text-forest-700',
                  marathi && 'font-marathi',
                )}
              >
                {t('section.gramSahakari.needTitle')}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {requirements.map(({ icon: Icon, textKey }) => (
                  <li key={textKey} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span
                      className={cn(
                        'pt-1.5 text-[15px] text-slate',
                        marathi && 'font-marathi',
                      )}
                    >
                      {t(textKey)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4
                className={cn(
                  'text-sm font-semibold uppercase tracking-wider text-forest-700',
                  marathi && 'font-marathi',
                )}
              >
                {t('section.gramSahakari.howTitle')}
              </h4>
              <p
                className={cn(
                  'mt-2 text-[15px] leading-relaxed text-muted-foreground',
                  marathi && 'font-marathi',
                )}
              >
                {t('become.timeline.apply.description')}
              </p>
              <Button asChild size="lg" className="mt-5 w-full sm:w-auto">
                <Link to="/become-gram-sahakari">
                  {t('section.gramSahakari.apply')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
