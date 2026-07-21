export const APPLICATION_STATUSES = [
  "DRAFT",
  "PAYMENT_PENDING",
  "SUBMITTED",
] as const;

export const PAYMENT_STATUSES = [
  "NOT_REQUIRED",
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;

export const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"] as const;

export const DOCUMENT_TYPES = [
  "photo",
  "aadhaarFront",
  "aadhaarBack",
  "cancelledCheque",
] as const;

/** Statuses that block creating a new application for the same user. */
export const BLOCKING_APPLICATION_STATUSES = [
  "DRAFT",
  "PAYMENT_PENDING",
  "SUBMITTED",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CLOUDINARY_GRAM_SAHAKARI_FOLDER = "kisan-katta/gram-sahakari";

export const DOCUMENT_IMAGE_MAX_EDGE_PX = 1600;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const INDIAN_PHONE_REGEX = /^(\+91[6-9][0-9]{9}|[6-9][0-9]{9})$/;

export const AUDIT_ACTIONS = [
  "APPLICATION_STARTED",
  "APPLICATION_NUMBER_GENERATED",
  "APPLICATION_UPDATED",
  "APPLICATION_READY_FOR_PAYMENT",
  "APPLICATION_SUBMITTED",
  "DOCUMENT_UPLOADED",
  "ROLE_CHANGED",
] as const;

// ---------------------------------------------------------------------------
// Application number
// ---------------------------------------------------------------------------

/** Counter document `_id` for the Gram Sahakari application sequence. */
export const GRAM_SAHAKARI_COUNTER_ID = "gram_sahakari_application";

/** Prefix for every application number, e.g. GS-2026-000001. */
export const APPLICATION_NUMBER_PREFIX = "GS";

/** Minimum zero-padded width of the numeric sequence segment. */
export const APPLICATION_NUMBER_SEQUENCE_PAD = 6;
