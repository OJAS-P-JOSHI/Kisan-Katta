import { AnimatePresence, motion } from 'framer-motion'
import { Download, Users } from 'lucide-react'
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

  const showGramBar = showGramSahakari && pastHero

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden',
        (showDownload || showGramBar) && 'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <AnimatePresence>
        {showGramBar && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pointer-events-auto border-t border-forest-100/80 bg-white/95 px-4 py-2.5 shadow-lift backdrop-blur-xl"
          >
            <Link
              to="/become-gram-sahakari"
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-forest-900 px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]',
                locale === 'mr' && 'font-marathi',
              )}
            >
              <Users className="h-4 w-4 shrink-0" />
              {t('cta.becomeGramSahakari')}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {showDownload && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto border-t border-gold-400/30 bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-3 shadow-lift"
        >
          <a
            href={appDownloadHref}
            className={cn(
              'flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-white/95 px-4 text-sm font-bold text-forest-900 shadow-soft transition-transform active:scale-[0.98]',
              locale === 'mr' && 'font-marathi',
            )}
          >
            <Download className="h-5 w-5 shrink-0 text-gold-600" />
            {t('cta.downloadApp')}
          </a>
        </motion.div>
      )}
    </div>
  )
}
