import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useId } from 'react'

import { useLanguage } from '@/i18n/LanguageProvider'
import { locales, type Locale } from '@/i18n/types'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  light?: boolean
  className?: string
}

export function LanguageToggle({ light = false, className }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage()
  const pillId = useId()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-0.5 transition-colors duration-300',
        light ? 'bg-white/15 backdrop-blur-sm' : 'bg-forest-50',
        className,
      )}
      role="group"
      aria-label="Language selection"
    >
      <Globe
        className={cn('ml-2 h-3.5 w-3.5 shrink-0', light ? 'text-white/80' : 'text-forest-700')}
        aria-hidden
      />
      {locales.map(({ code, label }) => {
        const isActive = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            aria-pressed={isActive}
            className={cn(
              'touch-target relative min-h-9 rounded-full px-2.5 text-xs font-semibold transition-colors duration-300 sm:px-3 sm:text-sm',
              code === 'mr' && 'font-marathi',
              isActive
                ? 'text-forest-900'
                : light
                  ? 'text-white/75 hover:text-white'
                  : 'text-steel hover:text-forest-900',
            )}
          >
            {isActive && (
              <motion.span
                layoutId={`lang-pill-${pillId}`}
                className="absolute inset-0 rounded-full bg-white shadow-soft"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
