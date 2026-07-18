import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { ScrollProgress } from '@/components/common/ScrollProgress'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomCTA } from '@/components/layout/MobileBottomCTA'
import { Navbar } from '@/components/layout/Navbar'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  hideFooter?: boolean
}

export function PageLayout({ children, hideFooter = false }: PageLayoutProps) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'
  const isLanding = location.pathname === '/'
  const showMobileCTA = !isLogin

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Navbar />
      <main
        className={cn(
          'flex-1',
          showMobileCTA && 'pb-28 sm:pb-32 lg:pb-0',
          showMobileCTA && isLanding && 'lg:pb-0',
        )}
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
      {showMobileCTA && (
        <MobileBottomCTA
          showDownload
          showGramSahakari={isLanding}
          observeHero={isLanding}
        />
      )}
    </div>
  )
}
