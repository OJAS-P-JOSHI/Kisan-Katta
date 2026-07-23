import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { translate, type TranslationKeys } from '@/i18n/translations'
import { LOCALE_STORAGE_KEY, type Locale } from '@/i18n/types'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'mr') return stored
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next === 'mr' ? 'mr' : 'en'
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'mr' ? 'mr' : 'en'
  }, [locale])

  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

export function useTranslation() {
  return useLanguage()
}
