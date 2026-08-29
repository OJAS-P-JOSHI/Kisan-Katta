import { motion, useReducedMotion } from 'framer-motion'
import { CloudSun, Home, ShoppingBasket, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { PhoneFrame } from '@/components/common/PhoneFrame'
import { ProductScreen } from '@/components/common/ProductScreen'
import { SectionTitle } from '@/components/common/SectionTitle'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { defaultTransition, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

const screens: {
  id: keyof typeof brandAssets.product
  src: string
  labelKey: TranslationKeys
  altKey: TranslationKeys
  descriptionKey: TranslationKeys
  icon: typeof Home
}[] = [
  {
    id: 'home',
    src: brandAssets.product.home,
    labelKey: 'section.product.screen.home',
    altKey: 'section.product.screen.homeAlt',
    descriptionKey: 'feature.community.description',
    icon: Home,
  },
  {
    id: 'weather',
    src: brandAssets.product.weather,
    labelKey: 'section.product.screen.weather',
    altKey: 'section.product.screen.weatherAlt',
    descriptionKey: 'feature.weather.description',
    icon: CloudSun,
  },
  {
    id: 'market',
    src: brandAssets.product.market,
    labelKey: 'section.product.screen.market',
    altKey: 'section.product.screen.marketAlt',
    descriptionKey: 'feature.govPrices.description',
    icon: TrendingUp,
  },
  {
    id: 'marketplace',
    src: brandAssets.product.marketplace,
    labelKey: 'section.product.screen.marketplace',
    altKey: 'section.product.screen.marketplaceAlt',
    descriptionKey: 'feature.marketplace.description',
    icon: ShoppingBasket,
  },
]

export function ProductShowcaseSection() {
  const { t, locale } = useTranslation()
  const reduced = useReducedMotion() ?? false
  const [active, setActive] = useState(0)
  const current = screens[active] ?? screens[0]
  const marathi = locale === 'mr'

  return (
    <section id="product" className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.product.eyebrow')}
          title={t('section.product.title')}
          marathiTitle={t('section.product.marathiTitle')}
          subtitle={t('section.product.subtitle')}
        />

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,18.5rem)_1fr] lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={defaultTransition}
          >
            <PhoneFrame label={t(current.altKey)}>
              <ProductScreen src={current.src} alt={t(current.altKey)} />
            </PhoneFrame>
          </motion.div>

          <div>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {screens.map((screen, index) => {
                const Icon = screen.icon
                const selected = index === active
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActive(index)}
                    className={cn(
                      'flex min-h-12 min-w-[9.5rem] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-300 motion-reduce:transition-none lg:min-w-0 lg:w-full',
                      selected
                        ? 'border-forest-200 bg-forest-50 shadow-soft'
                        : 'border-transparent bg-cream/80 hover:border-border hover:bg-cream',
                      marathi && 'font-marathi',
                    )}
                    aria-pressed={selected}
                  >
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        selected
                          ? 'bg-forest-900 text-white'
                          : 'bg-white text-forest-700',
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {t(screen.labelKey)}
                      </span>
                      <span className="mt-0.5 hidden text-xs leading-relaxed text-muted-foreground lg:block">
                        {t(screen.descriptionKey)}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {!reduced && (
              <p
                className={cn(
                  'mt-4 text-center text-sm text-muted-foreground lg:hidden',
                  marathi && 'font-marathi',
                )}
              >
                {t(current.descriptionKey)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
