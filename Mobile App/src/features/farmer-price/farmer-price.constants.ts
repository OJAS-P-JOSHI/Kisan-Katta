/** Poll window used for remaining-time progress (matches backend default). */
export const DEFAULT_POLL_DURATION_HOURS = 72;

/** Frontend-only price input limits (backend still validates business ranges). */
export const MAX_PRICE_DIGITS = 6;

/** Matches backend `MIN_REASON_LENGTH` / `MAX_REASON_LENGTH` for form gating only. */
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 200;

/** Matches backend `MINIMUM_VOTES_REQUIRED` for display only. */
export const MINIMUM_VOTES_REQUIRED = 10;

/** Insights list size expected from poll detail. */
export const RECENT_INSIGHTS_LIMIT = 5;

/**
 * Fallback vote band used only if a poll predates `allowedPriceRange`.
 * Mirrors backend `PRICE_VARIATION_PERCENT`, `MIN_PRICE_WITHOUT_GOV`,
 * `MAX_PRICE_WITHOUT_GOV` — the server remains the authority.
 */
export const PRICE_VARIATION_PERCENT = 40;
export const MIN_PRICE_WITHOUT_GOV = 1000;
export const MAX_PRICE_WITHOUT_GOV = 100000;

/**
 * Fixed Milk vote band (per litre). Mirrors backend `MILK_PRICE_RANGE`.
 * Prefer server `allowedPriceRange` when present.
 */
export const MILK_PRICE_RANGE = {
  min: 30,
  max: 150,
  default: 60,
  unit: 'Litre',
} as const;

export const MILK_CROP_NAME = 'Milk';

export const isMilkCrop = (crop: string): boolean =>
  crop.trim().toLowerCase() === MILK_CROP_NAME.toLowerCase();

/** Slider granularity in rupees; the thumb still snaps exactly onto the govt price. */
export const PRICE_SLIDER_STEP = 10;

/** Market signals shown on the summary card before "View Details". */
export const HOME_SIGNALS_LIMIT = 3;
