import { motion, useReducedMotion } from 'framer-motion'

import { BrandLogo } from '@/components/common/BrandLogo'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

/**
 * Intentional branded product-preview state — not a fake app UI,
 * and not an empty/broken slot.
 */
export function ComingSoonScreen({ className }: { className?: string }) {
  const { t, locale } = useTranslation()
  const reduced = useReducedMotion() ?? false
  const marathi = locale === 'mr'

  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-forest-50 via-cream to-gold-100/40 px-6 text-center',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-forest-900/10 to-transparent"
      />
      <div
        aria-hidden
        className="organic-blob pointer-events-none absolute inset-0"
      />

      <p
        className={cn(
          'relative text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-700',
          marathi && 'font-marathi',
        )}
      >
        {t('section.product.comingSoonTitle')}
      </p>
      <p
        className={cn(
          'relative mt-1 text-xs font-medium text-slate',
          marathi && 'font-marathi',
        )}
      >
        {t('section.product.comingSoonApp')}
      </p>

      <motion.div
        className="relative mt-6"
        initial={reduced ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <BrandLogo size="lg" showLink={false} priority />
      </motion.div>

      <p
        className={cn(
          'relative mt-6 max-w-[11rem] text-[13px] leading-snug text-ink',
          marathi && 'font-marathi',
        )}
      >
        {t('section.product.comingSoonBody')}
      </p>
      <p
        className={cn(
          'relative mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gold-600',
          marathi && 'font-marathi',
        )}
      >
        {t('section.product.comingSoon')}
      </p>
      <p
        className={cn(
          'relative mt-4 text-[10px] leading-relaxed text-steel',
          marathi && 'font-marathi',
        )}
      >
        {t('section.product.comingSoonFeatures')}
      </p>
    </div>
  )
}
