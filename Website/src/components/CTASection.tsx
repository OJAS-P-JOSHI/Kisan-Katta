import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { fadeUp, defaultTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface CTASectionProps {
  title: string
  description?: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
  className?: string
  children?: ReactNode
}

export function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  className,
  children,
}: CTASectionProps) {
  return (
    <section className={cn('section-padding', className)}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={fadeUp}
        transition={defaultTransition}
        className="container-wide"
      >
        <div className="relative overflow-hidden rounded-3xl bg-forest-900 px-8 py-16 text-center sm:px-12 lg:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(201,162,39,0.12),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(67,160,71,0.1),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            {description && (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/80">
                {description}
              </p>
            )}
            {children}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to={primaryHref}>{primaryLabel}</Link>
              </Button>
              {secondaryLabel && secondaryHref && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to={secondaryHref}>{secondaryLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
