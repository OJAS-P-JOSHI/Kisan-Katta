import { AnimatePresence, motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { BrandLogo } from '@/components/common/BrandLogo'
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { Button } from '@/components/ui/button'
import { appDownloadHref, drawerPortalLinks, navLinks } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const location = useLocation()
  const { t, locale } = useTranslation()

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label={t('common.closeMenu')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-forest-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={t('common.navMenu')}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-3rem,22rem)] flex-col rounded-l-3xl border-l border-white/20 bg-white/95 shadow-drawer backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <BrandLogo size="md" showLink={false} />
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.closeMenu')}
                className="touch-target flex items-center justify-center rounded-xl text-ink hover:bg-forest-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={cn(
                        'flex min-h-12 items-center rounded-2xl px-4 text-[15px] font-medium transition-colors',
                        locale === 'mr' && 'font-marathi',
                        location.pathname === link.href
                          ? 'bg-forest-50 text-forest-900'
                          : 'text-slate hover:bg-cream-dark hover:text-forest-900',
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-5 border-t border-border/60" />

              <ul className="space-y-1">
                {drawerPortalLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      to={link.href}
                      className={cn(
                        'flex min-h-12 items-center rounded-2xl px-4 text-[15px] font-medium transition-colors',
                        locale === 'mr' && 'font-marathi',
                        link.highlight
                          ? 'bg-forest-900 text-white hover:bg-forest-700'
                          : 'text-slate hover:bg-cream-dark hover:text-forest-900',
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-3 border-t border-border/60 p-4">
              <LanguageToggle className="w-full justify-center" />
              <Button asChild size="lg" variant="secondary" className="w-full">
                <a href={appDownloadHref}>
                  <Download className="h-5 w-5" />
                  {t('nav.downloadApp')}
                </a>
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

interface DrawerTriggerProps {
  onClick: () => void
  className?: string
  light?: boolean
}

export function DrawerTrigger({ onClick, className, light }: DrawerTriggerProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('common.openMenu')}
      className={cn(
        'touch-target flex items-center justify-center rounded-2xl transition-colors',
        light
          ? 'text-white hover:bg-white/15'
          : 'text-forest-900 hover:bg-forest-50',
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="4" x2="20" y1="6" y2="6" />
        <line x1="4" x2="20" y1="12" y2="12" />
        <line x1="4" x2="20" y1="18" y2="18" />
      </svg>
    </button>
  )
}
