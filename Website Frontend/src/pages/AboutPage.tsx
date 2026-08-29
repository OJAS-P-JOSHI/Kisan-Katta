import { motion } from 'framer-motion'
import { Heart, MapPin, Sprout, Users } from 'lucide-react'

import { PageIntro } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

const values: { icon: typeof Sprout; titleKey: TranslationKeys; descriptionKey: TranslationKeys }[] = [
  {
    icon: Sprout,
    titleKey: 'about.value.root.title',
    descriptionKey: 'about.value.root.description',
  },
  {
    icon: MapPin,
    titleKey: 'about.value.mh.title',
    descriptionKey: 'about.value.mh.description',
  },
  {
    icon: Users,
    titleKey: 'about.value.community.title',
    descriptionKey: 'about.value.community.description',
  },
  {
    icon: Heart,
    titleKey: 'about.value.farmer.title',
    descriptionKey: 'about.value.farmer.description',
  },
]

export function AboutPage() {
  const { t, locale } = useTranslation()
  const marathi = locale === 'mr'

  return (
    <PageLayout>
      <Seo title={t('seo.about.title')} description={t('seo.about.description')} path="/about" />
      <PageIntro
        kicker={t('section.about.eyebrow')}
        title={t('about.heroTitle')}
        marathiTitle={t('about.heroMarathi')}
        subtitle={t('about.heroSubtitle')}
      />

      <section className="section-padding !pt-10 bg-cream">
        <div className="container-wide">
          <div className="max-w-2xl space-y-6">
            <p
              className={cn(
                'text-xl leading-relaxed text-ink sm:text-2xl sm:leading-snug',
                marathi && 'font-marathi',
              )}
            >
              {t('about.body1')}
            </p>
            <p
              className={cn(
                'text-[15px] leading-relaxed text-slate sm:text-lg',
                marathi && 'font-marathi',
              )}
            >
              {t('about.body2')}
            </p>
          </div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-16 divide-y divide-border/70 border-t border-border/70"
          >
            {values.map((value) => (
              <motion.li
                key={value.titleKey}
                variants={fadeUp}
                transition={defaultTransition}
                className="grid gap-3 py-8 sm:grid-cols-[2rem_1fr] sm:gap-6"
              >
                <value.icon className="h-6 w-6 text-forest-700" aria-hidden />
                <div>
                  <h2 className={cn('text-lg font-semibold text-ink', marathi && 'font-marathi')}>
                    {t(value.titleKey)}
                  </h2>
                  <p
                    className={cn(
                      'mt-2 max-w-2xl leading-relaxed text-muted-foreground',
                      marathi && 'font-marathi',
                    )}
                  >
                    {t(value.descriptionKey)}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>
    </PageLayout>
  )
}
