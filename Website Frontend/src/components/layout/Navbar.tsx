import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { LanguageToggle } from '@/components/common/LanguageToggle'
import { BrandLogo } from '@/components/common/BrandLogo'
import { DrawerTrigger, MobileDrawer } from '@/components/layout/MobileDrawer'
import { desktopNavLinks } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const { t, locale } = useTranslation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const isHome = location.pathname === '/'
  const transparent = isHome && !isScrolled && !drawerOpen

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-500 ease-out',
          transparent
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-white/60 bg-white/70 shadow-[0_4px_30px_-8px_rgba(26,77,46,0.15)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60',
        )}
      >
        <nav
          className={cn(
            'container-wide flex items-center justify-between gap-3 px-4 transition-[height] duration-500 ease-out sm:px-5',
            transparent ? 'h-[4.5rem] sm:h-20' : 'h-16 sm:h-[4.5rem]',
          )}
        >
          <BrandLogo size="md" priority={isHome} className="h-12 w-12 sm:h-11 sm:w-11" />

          <div className="hidden items-center gap-1 lg:flex">
            {desktopNavLinks.map((link) => {
              const active = location.pathname === link.href
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-300',
                    locale === 'mr' && 'font-marathi',
                    transparent
                      ? active
                        ? 'text-white'
                        : 'text-white/80 hover:text-white'
                      : active
                        ? 'text-forest-900'
                        : 'text-slate hover:text-forest-900',
                  )}
                >
                  {t(link.key)}
                  <span
                    className={cn(
                      'absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300 ease-out',
                      transparent ? 'bg-white' : 'bg-forest-900',
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                    )}
                  />
                </Link>
              )
            })}
            <Link
              to="/application"
              className={cn(
                'ml-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300',
                locale === 'mr' && 'font-marathi',
                transparent
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'bg-forest-900 text-white hover:bg-forest-700',
              )}
            >
              {t('nav.apply')}
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle light={transparent} />
            <div className="lg:hidden">
              <DrawerTrigger onClick={() => setDrawerOpen(true)} light={transparent} />
            </div>
          </div>
        </nav>
      </motion.header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
