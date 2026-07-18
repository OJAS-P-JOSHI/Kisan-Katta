import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  CloudSun,
  Download,
  HandCoins,
  ShoppingBasket,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { OptimizedImage } from '@/components/common/OptimizedImage'
import { Button } from '@/components/ui/button'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { fadeUp, defaultTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

const floatingCards: {
  icon: typeof CloudSun
  labelKey: TranslationKeys
  labelMarathi: string
  delay: number
  position: string
}[] = [
  {
    icon: CloudSun,
    labelKey: 'features.weather',
    labelMarathi: 'हवामान',
    delay: 0,
    position: 'top-[18%] right-[4%] sm:right-[8%]',
  },
  {
    icon: TrendingUp,
    labelKey: 'features.marketPrices',
    labelMarathi: 'बाजार भाव',
    delay: 0.15,
    position: 'top-[42%] right-[2%] sm:right-[5%]',
  },
  {
    icon: ShoppingBasket,
    labelKey: 'features.marketplace',
    labelMarathi: 'बाजारपेठ',
    delay: 0.3,
    position: 'bottom-[28%] right-[6%] sm:right-[10%]',
  },
  {
    icon: HandCoins,
    labelKey: 'features.farmerPrice',
    labelMarathi: 'अपेक्षित भाव',
    delay: 0.45,
    position: 'bottom-[12%] left-[4%] sm:left-[8%]',
  },
]

function FloatingCard({
  icon: Icon,
  label,
  labelMarathi,
  delay,
  position,
}: {
  icon: typeof CloudSun
  label: string
  labelMarathi: string
  delay: number
  position: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...defaultTransition, delay: 0.6 + delay }}
      className={`absolute hidden sm:block ${position}`}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
        className="glass rounded-2xl px-4 py-3 shadow-card"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="font-marathi text-xs text-forest-700">{labelMarathi}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function HeroSection() {
  const { t, locale } = useTranslation()
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 400], [0, 40])

  return (
    <section id="hero" className="relative min-h-[100dvh] overflow-hidden">
      <motion.div style={{ y: imageY }} className="absolute inset-0">
        <OptimizedImage
          src={brandAssets.hero}
          alt="Maharashtra farmer using Kisan Katta app in the field"
          width={1920}
          height={1080}
          priority
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/75 via-forest-900/55 to-cream" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,146,10,0.12),transparent_45%)]" />
      </motion.div>

      {floatingCards.map((card) => (
        <FloatingCard
          key={card.labelMarathi}
          icon={card.icon}
          label={t(card.labelKey)}
          labelMarathi={card.labelMarathi}
          delay={card.delay}
          position={card.position}
        />
      ))}

      <div
        className={cn(
          'container-wide relative flex min-h-[100dvh] flex-col justify-end px-4 pb-28 pt-24 sm:justify-center sm:pb-16 sm:pt-28',
          locale === 'mr' && 'font-marathi',
        )}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ ...defaultTransition, delay: 0.1 }}
          className="max-w-xl sm:max-w-2xl"
        >
          <span className="mb-4 inline-block rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm sm:mb-5 sm:px-4 sm:py-1.5 sm:text-xs">
            {t('hero.eyebrow')}
          </span>

          <h1 className="text-[1.75rem] font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
            {t('hero.headline')}
          </h1>

          {locale === 'en' && (
            <p className="font-marathi mt-3 text-base text-white/90 sm:mt-4 sm:text-xl">
              तंत्रज्ञानाद्वारे महाराष्ट्रातील शेतकऱ्यांना सक्षम करणे
            </p>
          )}

          <p className="mt-4 text-[15px] leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
            {t('hero.subheadline')}
          </p>

          <div className="mt-5 flex flex-wrap gap-2 sm:hidden">
            {floatingCards.map(({ icon: Icon, labelMarathi }) => (
              <span
                key={labelMarathi}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-marathi">{labelMarathi}</span>
              </span>
            ))}
          </div>

          <div className="mt-7 hidden flex-col gap-3 sm:mt-9 sm:flex sm:flex-row sm:gap-4">
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
              <a href="#download">
                <Download className="h-5 w-5" />
                {t('hero.cta.download')}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white sm:w-auto"
            >
              <Link to="/become-gram-sahakari">
                {t('hero.cta.gramSahakari')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
