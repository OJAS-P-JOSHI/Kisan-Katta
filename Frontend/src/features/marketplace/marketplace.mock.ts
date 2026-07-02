import type { MarketplaceListing } from './marketplace.types';

export const mockMarketplaceListings: MarketplaceListing[] = [
  {
    id: 'listing-1',
    title: 'Fresh Tomatoes (50 kg)',
    category: 'produce',
    price: 1200,
    location: 'Nashik, Maharashtra',
    sellerName: 'Anil Sharma',
  },
  {
    id: 'listing-2',
    title: 'Mini Tractor Rotavator',
    category: 'equipment',
    price: 48000,
    location: 'Ludhiana, Punjab',
    sellerName: 'Gurpreet Singh',
  },
];
