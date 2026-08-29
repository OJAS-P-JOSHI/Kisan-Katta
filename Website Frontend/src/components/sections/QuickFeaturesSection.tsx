import { motion } from 'framer-motion'
import { CloudSun, HandCoins, ShoppingBasket, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { SectionTitle } from '@/components/common/SectionTitle'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { fadeUp, premiumEase, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

const quickFeatures: {
  icon: LucideIcon
  key: TranslationKeys
  marathi: string
}[] = [
  { icon: CloudSun, key: 'features.weather', marathi: 'हवामान' },
  { icon: TrendingUp, key: 'features.marketPrices', marathi: 'बाजार भाव' },
  { icon: ShoppingBasket, key: 'features.marketplace', marathi: 'बाजारपेठ' },
  { icon: Users, key: 'features.community', marathi: 'शेतकरी समुदाय' },
  { icon: HandCoins, key: 'features.farmerPrice', marathi: 'अपेक्षित भाव' },
]

export function QuickFeaturesSection() {
  const { t, locale } = useTranslation()
  const marathi = locale === 'mr'

  return (
    <section className="section-padding bg-cream" aria-label={t('section.quickFeatures.title')}>
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.quickFeatures.eyebrow')}
          title={t('section.quickFeatures.title')}
          align="left"
        />

        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={staggerContainer}
          className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {quickFeatures.map(({ icon: Icon, key, marathi: mr }) => (
            <motion.li
              key={key}
              variants={fadeUp}
              transition={{ duration: 0.45, ease: premiumEase }}
              className="w-[8.5rem] shrink-0 snap-start sm:w-auto"
            >
              <article className="h-full rounded-2xl border border-border/50 bg-white p-4 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p
                  className={cn(
                    'mt-3 text-sm font-semibold leading-snug text-ink',
                    marathi && 'font-marathi',
                  )}
                >
                  {t(key)}
                </p>
                {!marathi && (
                  <p className="font-marathi mt-0.5 text-xs text-forest-700">{mr}</p>
                )}
              </article>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
