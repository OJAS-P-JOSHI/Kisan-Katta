export const POLL_STATUSES = ["OPEN", "CLOSED"] as const;

export const CONFIDENCE_LEVELS = [
  "NOT_AVAILABLE",
  "LOW",
  "MEDIUM",
  "HIGH",
] as const;

export const REASON_TYPES = [
  "HIGH_DEMAND",
  "LOW_SUPPLY",
  "GOOD_QUALITY",
  "EXPORT_DEMAND",
  "HIGH_TRANSPORT_COST",
  "LOW_QUALITY",
  "STORAGE_AVAILABLE",
  "OTHER",
] as const;

export const DEFAULT_POLL_DURATION_HOURS = 72;
export const MINIMUM_VOTES_REQUIRED = 10;
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 200;
export const MIN_PRICE_WITHOUT_GOV = 1000;
export const MAX_PRICE_WITHOUT_GOV = 100000;
export const PRICE_VARIATION_PERCENT = 40;

/** Agmarknet modal prices are conventionally quoted per quintal. */
export const DEFAULT_GOVERNMENT_UNIT = "Quintal";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const RECENT_INSIGHTS_LIMIT = 5;
export const ANONYMOUS_FARMER_AUTHOR = "Anonymous Farmer";

export const COMMUNITY_PRICE_DISCLAIMER =
  "This is generated from anonymous farmer submissions. It is not an official market price.";

/** How often the farmer-price poll sync scheduler runs. */
export const FARMER_PRICE_SYNC_INTERVAL_MINUTES = 60;

/**
 * Minimum distinct farmer profiles that must list a district+crop pair
 * before an automatic poll is created for that pair.
 */
export const MIN_FARMERS_PER_POLL = 1;
