import { motion } from 'framer-motion'
import { CloudSun, HandCoins, ShoppingBasket, TrendingUp, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
    <section className="bg-cream px-0 py-10 lg:hidden" aria-label={t('section.quickFeatures.title')}>
      <div className="container-wide px-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-forest-700">
          {t('section.quickFeatures.eyebrow')}
        </span>
        <h2
          className={cn(
            'mt-1 text-2xl font-bold tracking-tight text-ink',
            marathi && 'font-marathi',
          )}
        >
          {t('section.quickFeatures.title')}
        </h2>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={staggerContainer}
        className="mt-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {quickFeatures.map(({ icon: Icon, key, marathi: mr }) => (
          <motion.article
            key={key}
            variants={fadeUp}
            transition={{ duration: 0.5, ease: premiumEase }}
            className="group w-[8.75rem] shrink-0 snap-start rounded-2xl border border-border/60 bg-white p-4 shadow-[0_6px_24px_-12px_rgba(15,42,25,0.28)] transition-all duration-300 active:scale-[0.98]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-700 transition-colors duration-300 group-hover:bg-forest-700 group-hover:text-white">
              <Icon className="h-6 w-6" />
            </div>
            <p className={cn('mt-3 text-sm font-semibold leading-snug text-ink', marathi && 'font-marathi')}>
              {t(key)}
            </p>
            {!marathi && <p className="font-marathi mt-0.5 text-xs text-forest-700">{mr}</p>}
          </motion.article>
        ))}
        {/* trailing spacer so the last card isn't flush to the edge */}
        <span aria-hidden className="w-1 shrink-0" />
      </motion.div>
    </section>
  )
}
