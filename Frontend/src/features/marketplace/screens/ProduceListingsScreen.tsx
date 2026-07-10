import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

import { ListingsBrowse } from '../components/ListingsBrowse';
import type { MarketplaceListing } from '../marketplace.types';

export default function ProduceListingsScreen() {
  const router = useRouter();
  const { search } = useLocalSearchParams<{ search?: string }>();

  const handleListingPress = useCallback(
    (listing: MarketplaceListing) => {
      router.push(`/marketplace-listing/${listing.id}` as Href);
    },
    [router],
  );

  return (
    <ListingsBrowse
      listingType="produce"
      initialSearch={typeof search === 'string' ? search : ''}
      onListingPress={handleListingPress}
    />
  );
}
