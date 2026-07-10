export const LISTING_TYPES = ["product", "produce"] as const;

export const MARKETPLACE_CATEGORIES = [
  "Produce",
  "Seeds",
  "Fertilizers",
  "Pesticides",
  "Farm Machinery",
  "Tools",
  "Irrigation",
  "Crop Protection",
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

export const LISTING_STATUSES = ["ACTIVE", "SOLD", "ARCHIVED"] as const;

export const LISTING_SORT_OPTIONS = [
  "newest",
  "price_low_to_high",
  "price_high_to_low",
] as const;

export const LISTING_EXPIRY_DAYS = 30;
export const MAX_LISTING_IMAGES = 5;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
