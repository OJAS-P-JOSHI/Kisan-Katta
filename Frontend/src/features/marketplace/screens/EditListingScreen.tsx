import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

import { ListingForm, listingFormScrollProps } from '../components/ListingForm';
import { ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { MarketplaceImageUploadError, useListingImages } from '../hooks/useListingImages';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListingById, updateListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListing, UpdateListingPayload } from '../marketplace.types';

type ListingFormPayload = Omit<UpdateListingPayload, 'images'>;

type EditListingFormProps = {
  listing: MarketplaceListing;
};

function EditListingForm({ listing }: EditListingFormProps) {
  const router = useRouter();
  const images = useListingImages(listing.images);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pendingPayloadRef = useRef<ListingFormPayload | null>(null);

  const publishUpdate = useCallback(
    async (payload: ListingFormPayload) => {
      setSubmitting(true);
      setServerError(null);
      images.clearUploadError();

      try {
        const uploadedImages = await images.uploadAll();
        await updateListing(listing.id, { ...payload, images: uploadedImages });
        router.back();
      } catch (err) {
        if (!(err instanceof MarketplaceImageUploadError)) {
          setServerError(getMarketplaceErrorMessage(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [images, listing.id, router],
  );

  const handleSubmit = useCallback(
    async (payload: ListingFormPayload) => {
      pendingPayloadRef.current = payload;
      await publishUpdate(payload);
    },
    [publishUpdate],
  );

  const handleRetryUpload = useCallback(() => {
    if (pendingPayloadRef.current) {
      void publishUpdate(pendingPayloadRef.current);
    }
  }, [publishUpdate]);

  return (
    <ListingForm
      initialListing={listing}
      images={images}
      onUploadRetry={handleRetryUpload}
      submitting={submitting}
      serverError={serverError}
      onSubmit={handleSubmit}
      submitLabel={marketplaceStrings.create.update}
      submittingLabel={
        images.isUploading ? marketplaceStrings.images.uploading : marketplaceStrings.create.updating
      }
    />
  );
}

export default function EditListingScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <ScrollView {...listingFormScrollProps}>
        <EditListingForm key={listing.id} listing={listing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
