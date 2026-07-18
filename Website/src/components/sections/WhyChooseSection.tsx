import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

import { InteractiveCard } from '@/components/common/InteractiveCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { whyChooseItems } from '@/data/features'
import { useTranslation } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'

export function WhyChooseSection() {
  const { t } = useTranslation()

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.why.eyebrow')}
          title={t('section.why.title')}
          marathiTitle="शेतकरी किसान कatta का निवडतात"
          subtitle={t('section.why.subtitle')}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          {whyChooseItems.map((item, index) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.08 }}
            >
              <InteractiveCard className="h-full">
                <div className="flex h-full gap-4 rounded-2xl border border-border/60 bg-cream p-5 sm:p-6">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-forest-700" />
                  <div>
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </InteractiveCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
