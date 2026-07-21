import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { useLanguage } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
  marathiTitle?: string
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  marathiTitle,
}: SectionTitleProps) {
  const { locale } = useLanguage()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      transition={defaultTransition}
      className={cn(
        'mb-10 max-w-3xl sm:mb-14',
        align === 'center' && 'mx-auto text-center',
        locale === 'mr' && 'font-marathi',
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-forest-50 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-forest-700 sm:px-4 sm:py-1.5 sm:text-xs">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {marathiTitle && locale === 'en' && (
        <p className="font-marathi mt-2 text-base text-forest-700 sm:text-lg">{marathiTitle}</p>
      )}
      {subtitle && (
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground sm:mt-4 sm:text-base md:text-lg">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}

interface PageHeroProps {
  title: string
  subtitle?: string
  marathiTitle?: string
  children?: ReactNode
}

export function PageHero({ title, subtitle, marathiTitle, children }: PageHeroProps) {
  const { locale } = useLanguage()

  return (
    <section className="relative overflow-hidden bg-forest-900 px-4 py-20 sm:px-5 sm:py-24 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,146,10,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(79,119,45,0.1),transparent_50%)]" />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={defaultTransition}
        className={cn(
          'container-wide relative text-center',
          locale === 'mr' && 'font-marathi',
        )}
      >
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {marathiTitle && locale === 'en' && (
          <p className="font-marathi mt-2 text-lg text-forest-100 sm:text-xl">{marathiTitle}</p>
        )}
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:mt-5 sm:text-lg">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-6 sm:mt-8">{children}</div>}
      </motion.div>
    </section>
  )
}
