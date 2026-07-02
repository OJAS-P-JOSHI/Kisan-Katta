import { sleep } from '@/utils';

import { mockMarketplaceListings } from './marketplace.mock';
import type { MarketplaceListing } from './marketplace.types';

/**
 * Fetches marketplace listings.
 * Returns mock data for now; swap to the `api` client when the endpoint exists.
 */
export const getMarketplaceListings = async (): Promise<MarketplaceListing[]> => {
  await sleep(300);
  return mockMarketplaceListings;
};
