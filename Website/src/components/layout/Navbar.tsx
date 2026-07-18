import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { LanguageToggle } from '@/components/common/LanguageToggle'
import { BrandLogo } from '@/components/common/BrandLogo'
import { DrawerTrigger, MobileDrawer } from '@/components/layout/MobileDrawer'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

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
        transition={{ duration: 0.4 }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          transparent
            ? 'bg-transparent'
            : 'border-b border-border/50 bg-white/92 shadow-soft backdrop-blur-xl',
        )}
      >
        <nav className="container-wide flex h-16 items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-5">
          <BrandLogo size="md" priority={isHome} />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle light={transparent} />
            <DrawerTrigger
              onClick={() => setDrawerOpen(true)}
              light={transparent}
            />
          </div>
        </nav>
      </motion.header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
