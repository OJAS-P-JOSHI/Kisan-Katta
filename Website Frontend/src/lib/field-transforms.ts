/** Keystroke sanitizers for wizard inputs. */

/** Keep digits only, clamped to `max` characters. */
export const sanitizeDigits = (value: string, max: number): string =>
  value.replace(/[^0-9]/g, '').slice(0, max)

/** Uppercase alphanumerics only (PAN), clamped to `max`. */
export const sanitizeUpperAlnum = (value: string, max: number): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, max)
