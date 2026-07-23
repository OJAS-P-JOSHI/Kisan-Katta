import { motion } from 'framer-motion'
import { Eye, Heart, Target, type LucideIcon } from 'lucide-react'

import { BrandCard } from '@/components/cards/BrandCard'
import { InteractiveCard } from '@/components/common/InteractiveCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

const aboutCards: {
  icon: LucideIcon
  titleKey: TranslationKeys
  descriptionKey: TranslationKeys
}[] = [
  {
    icon: Target,
    titleKey: 'about.mission.title',
    descriptionKey: 'about.mission.description',
  },
  {
    icon: Eye,
    titleKey: 'about.vision.title',
    descriptionKey: 'about.vision.description',
  },
  {
    icon: Heart,
    titleKey: 'about.why.title',
    descriptionKey: 'about.why.description',
  },
]

export function AboutSection() {
  const { t, locale } = useTranslation()

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.about.eyebrow')}
          title={t('section.about.title')}
          marathiTitle={t('section.about.marathiTitle')}
          subtitle={t('section.about.subtitle')}
        />

        <div className="mb-8 flex justify-center sm:mb-10 md:hidden">
          <BrandCard className="w-full max-w-xs" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-8"
        >
          {aboutCards.map((card, index) => (
            <motion.div
              key={card.titleKey}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.1 }}
            >
              <InteractiveCard className="h-full">
                <Card className="h-full border-border/60 bg-white shadow-none">
                  <CardContent className="p-6 text-center sm:p-8">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 sm:h-16 sm:w-16">
                      <card.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                    <h3
                      className={cn(
                        'text-xl font-semibold text-ink',
                        locale === 'mr' && 'font-marathi',
                      )}
                    >
                      {t(card.titleKey)}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {t(card.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              </InteractiveCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
