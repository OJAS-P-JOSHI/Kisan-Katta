/**
 * Profile language + favourite-crop limit constants.
 * Location / crop master data lives on the backend APIs — not here.
 */

/** Language codes accepted by the backend (`profile.language`). */
export const SUPPORTED_LANGUAGES = ['mr', 'en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  mr: 'मराठी (Marathi)',
  en: 'English',
  hi: 'हिन्दी (Hindi)',
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'mr';

/** Max favourite crops allowed on create/update profile. */
export const MAX_FAVOURITE_CROPS = 10;
