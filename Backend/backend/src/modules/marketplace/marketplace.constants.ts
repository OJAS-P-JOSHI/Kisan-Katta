export const LISTING_TYPES = ["product", "produce", "labour"] as const;

export const LABOUR_CATEGORIES = [
  "Harvesting",
  "Plantation",
  "Sugarcane Cutting",
  "Spraying",
  "Weeding",
  "Tractor Driver",
  "Farm Supervisor",
  "General Labour",
  "Daily Helper",
] as const;

/** Product listing categories (excludes Produce and Labour). */
export const PRODUCT_CATEGORIES = [
  "Seeds",
  "Fertilizers",
  "Pesticides",
  "Farm Machinery",
  "Tools",
  "Irrigation",
  "Crop Protection",
] as const;

/** All values allowed on the shared `category` field. */
export const MARKETPLACE_CATEGORIES = [
  "Produce",
  ...PRODUCT_CATEGORIES,
  ...LABOUR_CATEGORIES,
] as const;

export const MARKETPLACE_UNITS = [
  "Kg",
  "Quintal",
  "Ton",
  "Bag",
  "Packet",
  "Piece",
  "Litre",
] as const;

export const LABOUR_GENDERS = ["Male", "Female", "Mixed Group"] as const;

export const LABOUR_RATE_TYPES = ["per_day", "per_hour"] as const;

export const LISTING_STATUSES = ["ACTIVE", "SOLD", "ARCHIVED"] as const;

export const LISTING_SORT_OPTIONS = [
  "newest",
  "price_low_to_high",
  "price_high_to_low",
] as const;

export const LISTING_EXPIRY_DAYS = 30;
/** Renew only when remaining time is this many days or less (includes expired). */
export const LISTING_RENEW_MAX_REMAINING_DAYS = 7;
export const MAX_LISTING_IMAGES = 3;
export const MAX_LABOUR_LISTING_IMAGES = 2;
export const MAX_ACTIVE_LABOUR_LISTINGS = 3;
export const MAX_UPLOAD_IMAGES = 3;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CLOUDINARY_MARKETPLACE_FOLDER = "kisan-katta/marketplace";

export const LISTING_REPORT_REASONS = [
  "FALSE_INFORMATION",
  "FAKE_LISTING",
  "FRAUD",
  "WRONG_PRODUCE",
  "INAPPROPRIATE",
  "OTHER",
] as const;

export const REPORT_DETAILS_MAX_LENGTH = 300;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
