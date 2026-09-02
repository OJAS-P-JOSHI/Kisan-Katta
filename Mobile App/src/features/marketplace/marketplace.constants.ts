export const LISTING_TYPES = ['product', 'produce', 'labour'] as const;

export const LABOUR_CATEGORIES = [
  'Harvesting',
  'Plantation',
  'Sugarcane Cutting',
  'Spraying',
  'Weeding',
  'Tractor Driver',
  'Farm Supervisor',
  'General Labour',
  'Daily Helper',
] as const;

export const MARKETPLACE_CATEGORIES = [
  'Produce',
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Farm Machinery',
  'Tools',
  'Irrigation',
  'Crop Protection',
  ...LABOUR_CATEGORIES,
] as const;

export const PRODUCT_CATEGORIES = [
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Farm Machinery',
  'Tools',
  'Irrigation',
  'Crop Protection',
] as const;

export const LABOUR_GENDERS = ['Male', 'Female', 'Mixed Group'] as const;

export const LABOUR_RATE_TYPES = ['per_day', 'per_hour'] as const;

/** Gender choices shown in Majur Katta create/edit. API still accepts Mixed Group. */
export const LABOUR_GENDER_FORM_OPTIONS = ['Male', 'Female'] as const;

/** Rate type used for new Majur Katta listings. API still accepts per_hour. */
export const LABOUR_RATE_FORM_OPTION = 'per_day' as const;

export const MARKETPLACE_UNITS = [
  'Kg',
  'Quintal',
  'Ton',
  'Bag',
  'Packet',
  'Piece',
  'Litre',
] as const;

export const LISTING_STATUSES = ['ACTIVE', 'SOLD', 'ARCHIVED'] as const;

export const LISTING_SORT_OPTIONS = [
  'newest',
  'price_low_to_high',
  'price_high_to_low',
] as const;

/** Matches backend: renew only when remaining time is this many days or less. */
export const LISTING_RENEW_MAX_REMAINING_DAYS = 7;

export const MAX_LISTING_IMAGES = 3;
export const MAX_LABOUR_LISTING_IMAGES = 2;
export const MAX_ACTIVE_LABOUR_LISTINGS = 3;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const LISTING_REPORT_REASONS = [
  'FALSE_INFORMATION',
  'FAKE_LISTING',
  'FRAUD',
  'WRONG_PRODUCE',
  'INAPPROPRIATE',
  'OTHER',
] as const;

export const REPORT_DETAILS_MAX_LENGTH = 300;

export const CATEGORY_FILTER_ALL = 'All' as const;

export type CategoryFilter =
  | typeof CATEGORY_FILTER_ALL
  | (typeof MARKETPLACE_CATEGORIES)[number]
  | (typeof LABOUR_CATEGORIES)[number];
