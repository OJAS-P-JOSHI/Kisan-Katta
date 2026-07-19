import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight,
  CloudSun,
  Download,
  HandCoins,
  Leaf,
  ShoppingBasket,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { brandAssets } from '@/data/images'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { heroItem, heroStagger, premiumEase } from '@/lib/motion'
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
    position: 'top-[16%] right-[5%] xl:right-[8%]',
  },
  {
    icon: TrendingUp,
    labelKey: 'features.marketPrices',
    labelMarathi: 'बाजार भाव',
    delay: 0.15,
    position: 'top-[40%] right-[2%] xl:right-[4%]',
  },
  {
    icon: ShoppingBasket,
    labelKey: 'features.marketplace',
    labelMarathi: 'बाजारपेठ',
    delay: 0.3,
    position: 'bottom-[26%] right-[7%] xl:right-[11%]',
  },
  {
    icon: HandCoins,
    labelKey: 'features.farmerPrice',
    labelMarathi: 'अपेक्षित भाव',
    delay: 0.45,
    position: 'bottom-[12%] right-[26%] xl:right-[30%]',
  },
]

function FloatingCard({
  icon: Icon,
  label,
  labelMarathi,
  delay,
  position,
  reduced,
}: {
  icon: typeof CloudSun
  label: string
  labelMarathi: string
  delay: number
  position: string
  reduced: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: premiumEase, delay: 0.7 + delay }}
      className={cn('absolute hidden lg:block', position)}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -9, 0] }}
        transition={{ duration: 5 + delay * 2, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ y: -6, scale: 1.04 }}
        className="group cursor-default rounded-2xl border border-white/50 bg-white/80 px-4 py-3 shadow-[0_10px_40px_-12px_rgba(15,42,25,0.45)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_20px_50px_-12px_rgba(15,42,25,0.55)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-700 transition-colors duration-300 group-hover:bg-forest-700 group-hover:text-white">
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

/** Elegant, subtle floating leaf particles — desktop only, disabled for reduced motion. */
const leafParticles = [
  { left: '12%', top: '30%', size: 18, duration: 11, delay: 0, drift: 14 },
  { left: '22%', top: '68%', size: 14, duration: 13, delay: 1.5, drift: 10 },
  { left: '46%', top: '22%', size: 16, duration: 12, delay: 0.8, drift: 12 },
  { left: '62%', top: '74%', size: 20, duration: 14, delay: 2.2, drift: 16 },
  { left: '78%', top: '40%', size: 15, duration: 10, delay: 1.1, drift: 11 },
]

function LeafField() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
      {leafParticles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute text-gold-100/40"
          style={{ left: p.left, top: p.top }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -p.drift, 0],
            x: [0, p.drift * 0.6, 0],
            rotate: [0, 18, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Leaf style={{ width: p.size, height: p.size }} />
        </motion.div>
      ))}
    </div>
  )
}

export function HeroSection() {
  const { t, locale } = useTranslation()
  const reduced = useReducedMotion() ?? false
  const { scrollY } = useScroll()
  const imageY = useTransform(scrollY, [0, 500], [0, 60])

  return (
    <section id="hero" className="relative min-h-[100dvh] overflow-hidden bg-forest-900">
      {/* Background photograph — crisp on desktop, subtly softened on mobile */}
      <motion.div style={reduced ? undefined : { y: imageY }} className="absolute inset-0">
        <img
          src={brandAssets.hero}
          alt="A Maharashtra farmer using the Kisan Katta app in a field at golden hour"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="hidden h-full w-full object-cover object-center sm:block"
        />
        <img
          src={brandAssets.heroMobile}
          alt=""
          aria-hidden
          width={1080}
          height={1350}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full scale-105 object-cover object-center blur-[3px] sm:hidden"
        />
      </motion.div>

      {/* Depth & lighting — gradients, overlays and vignette instead of blur (desktop) */}
      {/* Directional dark gradient anchoring the copy on the left */}
      <div className="absolute inset-0 bg-gradient-to-r from-forest-900/85 via-forest-900/45 to-transparent sm:from-forest-900/80 sm:via-forest-900/30" />
      {/* Vertical grounding gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-forest-900/75 via-transparent to-forest-900/30" />
      {/* Cinematic vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_45%,transparent_42%,rgba(10,33,19,0.6)_100%)]" />

      {/* Blurred colored light blobs for depth */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-forest-500/25 blur-3xl"
        animate={reduced ? undefined : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[12%] h-80 w-80 rounded-full bg-gold-400/25 blur-3xl"
        animate={reduced ? undefined : { opacity: [0.3, 0.55, 0.3], scale: [1, 1.12, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <LeafField />

      {/* Smooth transition into the next (cream) section */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-cream" />

      {floatingCards.map((card) => (
        <FloatingCard
          key={card.labelMarathi}
          icon={card.icon}
          label={t(card.labelKey)}
          labelMarathi={card.labelMarathi}
          delay={card.delay}
          position={card.position}
          reduced={reduced}
        />
      ))}

      <div
        className={cn(
          'container-wide relative flex min-h-[100dvh] flex-col justify-end px-4 pb-28 pt-24 sm:justify-center sm:px-5 sm:pb-16 sm:pt-28',
          locale === 'mr' && 'font-marathi',
        )}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={heroStagger}
          className="max-w-xl sm:max-w-2xl"
        >
          <motion.span
            variants={heroItem}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md sm:mb-6 sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            {t('hero.eyebrow')}
          </motion.span>

          <motion.h1
            variants={heroItem}
            className="text-[2rem] font-bold leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(10,33,19,0.35)] sm:text-5xl md:text-6xl lg:text-[4.25rem]"
          >
            {t('hero.headline')}
          </motion.h1>

          {locale === 'en' && (
            <motion.p
              variants={heroItem}
              className="font-marathi mt-4 text-base text-gold-100 sm:mt-5 sm:text-xl"
            >
              तंत्रज्ञानाद्वारे महाराष्ट्रातील शेतकऱ्यांना सक्षम करणे
            </motion.p>
          )}

          <motion.p
            variants={heroItem}
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85 sm:mt-6 sm:text-lg sm:leading-relaxed"
          >
            {t('hero.subheadline')}
          </motion.p>

          <motion.div variants={heroItem} className="mt-6 flex flex-wrap gap-2 sm:hidden">
            {floatingCards.map(({ icon: Icon, labelMarathi }) => (
              <span
                key={labelMarathi}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="font-marathi">{labelMarathi}</span>
              </span>
            ))}
          </motion.div>

          {/* CTA — Become Gram Sahakari is the primary action */}
          <motion.div
            variants={heroItem}
            className="mt-8 hidden flex-col gap-3.5 sm:mt-10 sm:flex sm:flex-row sm:gap-4"
          >
            <Button asChild size="lg" variant="glow" className="w-full sm:w-auto">
              <Link to="/become-gram-sahakari">
                {t('hero.cta.gramSahakari')}
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="glass"
              className="w-full sm:w-auto"
            >
              <a href="#download">
                <Download className="h-5 w-5" />
                {t('hero.cta.download')}
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-6 hidden justify-center lg:flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          <div className="flex h-9 w-6 items-start justify-center rounded-full border border-white/40 p-1.5">
            <motion.span
              className="h-2 w-1 rounded-full bg-white/80"
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </section>
  )
}
