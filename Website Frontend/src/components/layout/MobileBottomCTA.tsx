import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useTranslation } from '@/i18n/LanguageProvider'
import { appDownloadHref } from '@/data/site'
import { cn } from '@/lib/utils'

interface MobileBottomCTAProps {
  showDownload?: boolean
  showGramSahakari?: boolean
  observeHero?: boolean
}

export function MobileBottomCTA({
  showDownload = true,
  showGramSahakari = false,
  observeHero = false,
}: MobileBottomCTAProps) {
  const { t, locale } = useTranslation()
  const reduced = useReducedMotion() ?? false
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    if (!observeHero) {
      setPastHero(showGramSahakari)
      return
    }

    const hero = document.getElementById('hero')
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' },
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [observeHero, showGramSahakari])

  if (!showDownload && !showGramSahakari) return null

  const showBar = showGramSahakari ? pastHero : true

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden',
        showBar && 'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 20, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 320, damping: 28 }
            }
            className="pointer-events-auto border-t border-forest-100/80 bg-white/96 px-4 py-2.5 shadow-lift backdrop-blur-xl"
          >
            <Link
              to="/become-gram-sahakari"
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-forest-900 px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98] motion-reduce:active:scale-100',
                locale === 'mr' && 'font-marathi',
              )}
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              {t('cta.becomeGramSahakari')}
            </Link>
            {showDownload && (
              <a
                href={appDownloadHref}
                className={cn(
                  'mt-1.5 flex min-h-10 items-center justify-center text-xs font-medium text-steel underline-offset-4 hover:text-forest-800 hover:underline',
                  locale === 'mr' && 'font-marathi',
                )}
              >
                {t('cta.downloadSoon')}
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
