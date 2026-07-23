/**
 * Image sources used across the website.
 *
 * Local assets live in `/public` and resolve from the site root in both
 * Vite dev and production builds.
 *
 * @see IMAGE_SOURCES.md for attribution and Gram Sahakari replacement specs
 */

export const brandAssets = {
  logo: '/logo-circle.png',
  /** Flat brand illustration (auth screens) */
  illustration: '/login-hero.png',
  /** Cinematic hero — Maharashtra farmer at golden hour */
  hero: '/hero-field.webp',
  /** Portrait crop for mobile hero */
  heroMobile: '/hero-mobile.webp',
  /**
   * Gram Sahakari section / apply CTA portrait (4:5).
   *
   * CURRENT: interim brand-owned portrait (same visual family as hero-mobile).
   * REPLACE by dropping a new file at `public/gram-sahakari.webp` — no code
   * change required if the filename stays the same. See IMAGE_SOURCES.md.
   */
  gramSahakari: '/gram-sahakari.webp',
} as const

/** Royalty-free Unsplash agriculture imagery (commercial use) — secondary accents only. */
export const unsplash = {
  /** Annie Spratt — green farmland */
  farmland:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
  /** Tim Mossholder — crop harvest */
  harvest:
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80&auto=format&fit=crop',
  /** Greenhouse / rural agriculture landscape */
  village:
    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200&q=80&auto=format&fit=crop',
  /** Hands with fresh produce */
  produce:
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop',
} as const
