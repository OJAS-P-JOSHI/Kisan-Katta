import { motion } from 'framer-motion'
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
  const [active, setActive] = useState(0)
  const current = screens[active] ?? screens[0]
  const marathi = locale === 'mr'

  return (
    <section id="product" className="section-padding bg-white">
      <div className="container-wide min-w-0">
        <SectionTitle
          eyebrow={t('section.product.eyebrow')}
          title={t('section.product.title')}
          marathiTitle={t('section.product.marathiTitle')}
          subtitle={t('section.product.subtitle')}
          className="mb-8 max-w-[min(92vw,22rem)] sm:mb-12 sm:max-w-xl lg:max-w-3xl [&_h2]:mx-auto [&_h2]:max-w-[14rem] [&_h2]:text-pretty [&_h2]:leading-snug sm:[&_h2]:max-w-none sm:[&_h2]:leading-tight"
        />

        <div className="grid min-w-0 items-center gap-8 md:grid-cols-[minmax(0,16.5rem)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,18.5rem)_minmax(0,1fr)] lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            transition={defaultTransition}
            className="relative mx-auto w-full min-w-0 max-w-[min(72vw,15.5rem)] md:mx-0 md:max-w-[16.5rem] lg:max-w-[18.5rem]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[42%] h-[58%] w-[min(100%,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-forest-50 blur-2xl md:w-[78%] md:blur-3xl"
            />
            <PhoneFrame className="relative" label={t(current.altKey)}>
              <ProductScreen src={current.src} alt={t(current.altKey)} />
            </PhoneFrame>
          </motion.div>

          <div className="min-w-0">
            <div className="flex flex-wrap justify-center gap-2 md:flex-col">
              {screens.map((screen, index) => {
                const Icon = screen.icon
                const selected = index === active
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActive(index)}
                    className={cn(
                      'flex min-h-12 min-w-0 basis-[calc(50%-0.25rem)] items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 motion-reduce:transition-none md:w-full md:basis-auto md:px-4',
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
                      <span className="block text-sm font-semibold leading-snug text-ink">
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

            <p
              className={cn(
                'mx-auto mt-4 max-w-[min(92vw,22rem)] text-center text-sm leading-relaxed text-muted-foreground md:mx-0 md:max-w-none md:text-left lg:hidden',
                marathi && 'font-marathi',
              )}
            >
              {t(current.descriptionKey)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
