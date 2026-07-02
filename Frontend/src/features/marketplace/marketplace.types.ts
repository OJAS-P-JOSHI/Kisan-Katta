import type { ID } from '@/types';

export type ListingCategory = 'produce' | 'equipment' | 'seeds' | 'livestock';

export type MarketplaceListing = {
  id: ID;
  title: string;
  category: ListingCategory;
  price: number;
  location: string;
  sellerName: string;
};
