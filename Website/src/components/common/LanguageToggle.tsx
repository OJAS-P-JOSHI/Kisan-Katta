import { Globe } from 'lucide-react'

import { useLanguage } from '@/i18n/LanguageProvider'
import { locales, type Locale } from '@/i18n/types'
import { cn } from '@/lib/utils'

interface LanguageToggleProps {
  light?: boolean
  className?: string
}

export function LanguageToggle({ light = false, className }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage()

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-0.5',
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
      {locales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          aria-pressed={locale === code}
          className={cn(
            'touch-target min-h-9 rounded-full px-2.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm',
            code === 'mr' && 'font-marathi',
            locale === code
              ? light
                ? 'bg-white text-forest-900 shadow-soft'
                : 'bg-white text-forest-900 shadow-soft'
              : light
                ? 'text-white/75 hover:text-white'
                : 'text-steel hover:text-forest-900',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
