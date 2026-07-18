import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/common/BrandLogo'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { brandAssets } from '@/data/images'
import { defaultTransition, fadeUp } from '@/lib/motion'

interface AuthLayoutProps {
  title: string
  subtitle: ReactNode
  children: ReactNode
  /** Optional secondary action rendered below the card (e.g. back link). */
  footer?: ReactNode
}

/**
 * Shared premium auth layout.
 * - Desktop: brand image on the left, glass card on the right.
 * - Mobile (360+): centered card over a dimmed brand image, no horizontal scroll.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-[100dvh] w-full overflow-hidden">
      {/* Left: brand image (desktop only) */}
      <div className="relative hidden w-1/2 shrink-0 lg:block">
        <OptimizedImage
          src={brandAssets.hero}
          alt=""
          width={1200}
          height={1600}
          priority
          className="h-full w-full object-cover"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-900/70 via-forest-900/55 to-forest-900/85" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 xl:p-14">
          <BrandLogo size="lg" priority />
          <div className="max-w-md">
            <h2 className="text-3xl font-bold leading-tight text-white xl:text-4xl">
              Kisan Katta
            </h2>
            <p className="font-marathi mt-2 text-lg text-gold-100">
              शेतकऱ्यांचे डिजिटल व्यासपीठ
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              A trusted platform connecting farmers, Gram Sahakari, and the
              community — empowering rural India, digitally.
            </p>
          </div>
        </div>
      </div>

      {/* Right: card */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        {/* Mobile background image */}
        <div className="absolute inset-0 lg:hidden">
          <OptimizedImage
            src={brandAssets.hero}
            alt=""
            width={1080}
            height={1920}
            priority
            className="h-full w-full object-cover"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-900/80 via-forest-900/70 to-forest-900/90" />
        </div>
        <div className="organic-blob absolute inset-0 hidden lg:block" aria-hidden />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={defaultTransition}
          className="relative w-full max-w-md"
        >
          <div className="mb-6 flex justify-center lg:hidden">
            <BrandLogo size="xl" priority />
          </div>

          <div className="glass rounded-3xl p-6 shadow-lift sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
              <p className="font-marathi mt-1 text-sm text-forest-700">
                ग्राम सहकारी पोर्टल
              </p>
              <div className="mt-2 text-sm text-muted-foreground">{subtitle}</div>
            </div>

            {children}
          </div>

          {footer && <div className="mt-4 text-center">{footer}</div>}

          <p className="mt-4 text-center">
            <Link to="/" className="text-sm text-white/80 hover:text-white lg:text-muted-foreground lg:hover:text-forest-900">
              ← Back to Home
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
