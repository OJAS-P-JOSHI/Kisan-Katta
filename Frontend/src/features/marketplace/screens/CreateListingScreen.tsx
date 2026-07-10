import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { ListingForm } from '../components/ListingForm';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { createListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { CreateListingPayload, UpdateListingPayload } from '../marketplace.types';

export default function CreateListingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (payload: CreateListingPayload | UpdateListingPayload) => {
      setSubmitting(true);
      setServerError(null);
      try {
        const listing = await createListing(payload as CreateListingPayload);
        router.replace(`/marketplace-listing/${listing.id}` as Href);
      } catch (err) {
        setServerError(getMarketplaceErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [router],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ListingForm
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        submitLabel={marketplaceStrings.create.publish}
        submittingLabel={marketplaceStrings.create.publishing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
