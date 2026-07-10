export const LISTING_TYPES = ['product', 'produce'] as const;

export const MARKETPLACE_CATEGORIES = [
  'Produce',
  'Seeds',
  'Fertilizers',
  'Pesticides',
  'Farm Machinery',
  'Tools',
  'Irrigation',
  'Crop Protection',
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

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const CATEGORY_FILTER_ALL = 'All' as const;

export type CategoryFilter = typeof CATEGORY_FILTER_ALL | (typeof MARKETPLACE_CATEGORIES)[number];
