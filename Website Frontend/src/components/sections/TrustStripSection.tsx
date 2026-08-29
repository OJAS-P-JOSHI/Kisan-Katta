import { motion } from 'framer-motion'
import { Globe, Heart, Languages, Sprout } from 'lucide-react'

import { SectionTitle } from '@/components/common/SectionTitle'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

const trustPoints: {
  icon: typeof Sprout
  titleKey: TranslationKeys
  bodyKey: TranslationKeys
}[] = [
  {
    icon: Sprout,
    titleKey: 'section.trust.maharashtra',
    bodyKey: 'section.trust.maharashtraBody',
  },
  {
    icon: Languages,
    titleKey: 'section.trust.marathi',
    bodyKey: 'section.trust.marathiBody',
  },
  {
    icon: Heart,
    titleKey: 'section.trust.farmer',
    bodyKey: 'section.trust.farmerBody',
  },
  {
    icon: Globe,
    titleKey: 'section.trust.independent',
    bodyKey: 'section.trust.independentBody',
  },
]

export function TrustStripSection() {
  const { t, locale } = useTranslation()

  return (
    <section className="section-padding bg-cream">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.trust.eyebrow')}
          title={t('section.trust.title')}
        />

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {trustPoints.map((point) => {
            const Icon = point.icon
            return (
              <motion.li
                key={point.titleKey}
                variants={fadeUp}
                transition={defaultTransition}
                className="rounded-2xl border border-border/50 bg-white px-5 py-6"
              >
                <Icon className="h-5 w-5 text-forest-700" aria-hidden />
                <h3
                  className={cn(
                    'mt-4 text-sm font-semibold text-ink',
                    locale === 'mr' && 'font-marathi',
                  )}
                >
                  {t(point.titleKey)}
                </h3>
                <p
                  className={cn(
                    'mt-1.5 text-sm leading-relaxed text-muted-foreground',
                    locale === 'mr' && 'font-marathi',
                  )}
                >
                  {t(point.bodyKey)}
                </p>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
