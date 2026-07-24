export type Locale = 'en' | 'mr'

export const LOCALE_STORAGE_KEY = 'kisan-katta-locale'

/** Persists Digital ID Card export language only — never changes site locale. */
export const ID_CARD_LOCALE_STORAGE_KEY = 'kisan-katta-id-card-locale'

export const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'mr', label: 'मराठी' },
]
