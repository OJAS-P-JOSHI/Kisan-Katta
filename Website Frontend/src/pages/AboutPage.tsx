import { motion } from 'framer-motion'
import { Heart, MapPin, Sprout, Users } from 'lucide-react'

import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'

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
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo title={t('seo.about.title')} description={t('seo.about.description')} path="/about" />
      <PageHero
        title={t('about.heroTitle')}
        marathiTitle={t('about.heroMarathi')}
        subtitle={t('about.heroSubtitle')}
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-slate">{t('about.body1')}</p>
            <p className="mt-6 text-lg leading-relaxed text-slate">{t('about.body2')}</p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 sm:grid-cols-2"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.titleKey}
                variants={fadeUp}
                transition={{ ...defaultTransition, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                      <value.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold text-ink">{t(value.titleKey)}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {t(value.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
