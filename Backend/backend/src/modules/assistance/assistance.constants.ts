/**
 * Farmer Assistance — verified farmers publish genuine help requests so the
 * community can respond with guidance and support.
 *
 * Version 1 is publishing + moderation only. No money movement of any kind
 * (no UPI, QR, Razorpay, wallets, donations) is part of this module.
 */

export const HELP_REQUEST_STATUSES = [
  "PENDING_REVIEW",
  "OPEN",
  "RESOLVED",
  "REJECTED",
  "ARCHIVED",
] as const;

/** Statuses that count against a farmer's active-request quota. */
export const ACTIVE_HELP_REQUEST_STATUSES = ["PENDING_REVIEW", "OPEN"] as const;

/** Statuses visible in the public assistance feed. */
export const PUBLIC_HELP_REQUEST_STATUSES = ["OPEN", "RESOLVED"] as const;

/** Statuses the author may still edit. */
export const EDITABLE_HELP_REQUEST_STATUSES = ["PENDING_REVIEW", "OPEN"] as const;

export const HELP_REQUEST_SORT_OPTIONS = ["newest", "most_supported"] as const;

export const REPORT_REASONS = [
  "SPAM",
  "FAKE_INFORMATION",
  "INAPPROPRIATE_IMAGES",
  "OTHER",
] as const;

/** A farmer may hold at most this many PENDING_REVIEW / OPEN requests. */
export const MAX_ACTIVE_HELP_REQUESTS = 2;

export const ACTIVE_LIMIT_MESSAGE =
  "You already have two active help requests. Resolve one before creating another.";

export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MIN_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 3000;
export const REPORT_DETAILS_MAX_LENGTH = 300;
export const MODERATION_NOTE_MAX_LENGTH = 300;

export const MIN_HELP_REQUEST_IMAGES = 1;
export const MAX_HELP_REQUEST_IMAGES = 3;
export const MAX_UPLOAD_IMAGES = 3;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CLOUDINARY_ASSISTANCE_FOLDER = "kisan-katta/assistance";

/**
 * Farmer profiles store district / taluka / village only — the platform is
 * Maharashtra-only today. The author snapshot still persists a state so future
 * expansion never has to backfill historical requests.
 */
export const AUTHOR_DEFAULT_STATE = "Maharashtra";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
