export type Locale = 'en' | 'mr'

export const LOCALE_STORAGE_KEY = 'kisan-katta-locale'

export const locales: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'mr', label: 'मराठी' },
]
