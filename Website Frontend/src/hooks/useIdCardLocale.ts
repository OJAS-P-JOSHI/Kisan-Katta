import { useCallback, useState } from 'react'

import { ID_CARD_LOCALE_STORAGE_KEY, type Locale } from '@/i18n/types'

/** Default export language for farmers / village volunteers. */
const DEFAULT_ID_CARD_LOCALE: Locale = 'mr'

function readStoredIdCardLocale(): Locale {
  try {
    const stored = localStorage.getItem(ID_CARD_LOCALE_STORAGE_KEY)
    if (stored === 'en' || stored === 'mr') return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_ID_CARD_LOCALE
}

/**
 * Language for Digital ID Card face + exports only.
 * Independent of website / admin / application locale.
 */
export function useIdCardLocale() {
  const [cardLocale, setCardLocaleState] = useState<Locale>(readStoredIdCardLocale)

  const setCardLocale = useCallback((next: Locale) => {
    setCardLocaleState(next)
    try {
      localStorage.setItem(ID_CARD_LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  return { cardLocale, setCardLocale }
}
