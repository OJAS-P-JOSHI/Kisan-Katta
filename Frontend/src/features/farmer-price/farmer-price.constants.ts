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

/** Client-side page size for comments bottom sheet. */
export const COMMENTS_PAGE_SIZE = 20;
