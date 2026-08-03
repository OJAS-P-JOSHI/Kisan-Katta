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

export const MAX_LISTING_IMAGES = 3;
export const MAX_LABOUR_LISTING_IMAGES = 2;
export const MAX_ACTIVE_LABOUR_LISTINGS = 3;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const CATEGORY_FILTER_ALL = 'All' as const;

export type CategoryFilter =
  | typeof CATEGORY_FILTER_ALL
  | (typeof MARKETPLACE_CATEGORIES)[number]
  | (typeof LABOUR_CATEGORIES)[number];
