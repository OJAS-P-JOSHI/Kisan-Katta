import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { ListingForm } from '../components/ListingForm';
import { ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListingById, updateListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListing, UpdateListingPayload } from '../marketplace.types';

export default function EditListingScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fetchListing = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError(marketplaceStrings.errors.generic);
      setLoading(false);
      return;
    }

    try {
      const data = await getListingById(id);
      setListing(data);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleSubmit = useCallback(
    async (payload: UpdateListingPayload) => {
      if (!id || typeof id !== 'string') return;

      setSubmitting(true);
      setServerError(null);
      try {
        await updateListing(id, payload);
        router.back();
      } catch (err) {
        setServerError(getMarketplaceErrorMessage(err));
      } finally {
        setSubmitting(false);
      }
    },
    [id, router],
  );

  if (loading) {
    return <ListingLoadingView />;
  }

  if (error || !listing) {
    return (
      <ListingErrorView
        title={marketplaceStrings.detail.errorTitle}
        message={error ?? marketplaceStrings.errors.generic}
        onRetry={fetchListing}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ListingForm
        initialListing={listing}
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleSubmit}
        submitLabel={marketplaceStrings.create.update}
        submittingLabel={marketplaceStrings.create.updating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
