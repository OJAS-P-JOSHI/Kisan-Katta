import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { ListingsBrowse } from '../components/ListingsBrowse';
import type { MarketplaceListing } from '../marketplace.types';

export default function LabourListingsScreen() {
  const router = useRouter();

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      router.push(`/marketplace-listing/${listing.id}` as Href);
    },
    [router],
  );

  return <ListingsBrowse listingType="labour" onListingPress={handleListingPress} />;
}
