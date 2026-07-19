/**
 * Royalty-free image sources used across the website.
 * All images are licensed for commercial use via Unsplash or local assets.
 *
 * @see IMAGE_SOURCES.md for full attribution
 */

export const brandAssets = {
  logo: '/logo-circle.png',
  /** Flat brand illustration (used on auth screens, not as a full-bleed background) */
  illustration: '/login-hero.png',
  /** Optimized cinematic hero photograph — Maharashtra farmer at golden hour */
  hero: '/hero-field.webp',
  /** Dedicated portrait composition for mobile — farmer in the upper half */
  heroMobile: '/hero-mobile.webp',
} as const

/** Unsplash — Indian agriculture, commercial use */
export const unsplash = {
  /** Photo by Annie Spratt — green farmland, Maharashtra-style fields */
  farmland:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
  /** Photo by Zoe Schaeffer — farmer in field */
  farmerCommunity:
    'https://images.unsplash.com/photo-1593113598332-cd288d649329?w=800&q=80&auto=format&fit=crop',
  /** Photo by Tim Mossholder — crop harvest */
  harvest:
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=80&auto=format&fit=crop',
  /** Photo by Steven Weeks — rural village landscape */
  village:
    'https://images.unsplash.com/photo-1574943326839-325b47a2b64a?w=1200&q=80&auto=format&fit=crop',
  /** Photo by Priscilla Du Preez — hands with produce */
  produce:
    'https://images.unsplash.com/photo-1464226184743-18fb9a2f7c8c?w=800&q=80&auto=format&fit=crop',
} as const
