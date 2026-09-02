import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/context/AuthContext';

import {
  ListingForm,
  listingFormScrollProps,
  type ListingCreateSubmitPayload,
  type ListingFormSubmitPayload,
} from '../components/ListingForm';
import { ListingLoadingView } from '../components/ListingStateViews';
import { MarketplaceImageUploadError, useListingImages } from '../hooks/useListingImages';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { createListing, getListingById } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';
import type { MarketplaceListing } from '../marketplace.types';
import { isListingOwner } from '../marketplace.utils';

type ListingFormPayload = ListingCreateSubmitPayload;

export default function CreateListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const sourceId = typeof from === 'string' ? from : undefined;

  const images = useListingImages();
  const [prefill, setPrefill] = useState<MarketplaceListing | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(!!sourceId);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const pendingPayloadRef = useRef<ListingFormPayload | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!sourceId) return;

    let cancelled = false;

    (async () => {
      try {
        const listing = await getListingById(sourceId);
        if (cancelled) return;
        if (!isListingOwner(listing.sellerId, user?.userId)) {
          setPrefill(null);
          setSnackbar(marketplaceStrings.errors.generic);
          return;
        }
        setPrefill(listing);
        setSnackbar(marketplaceStrings.myListings.duplicatePrefill);
      } catch {
        if (!cancelled) {
          setPrefill(null);
          setSnackbar(marketplaceStrings.errors.generic);
        }
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceId, user?.userId]);

  const publishListing = useCallback(
    async (payload: ListingFormPayload) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setServerError(null);
      images.clearUploadError();

      try {
        const uploadedImages = await images.uploadAll();
        const listing = await createListing({ ...payload, images: uploadedImages });
        router.replace(`/marketplace-listing/${listing.id}?published=1` as Href);
      } catch (err) {
        if (!(err instanceof MarketplaceImageUploadError)) {
          setServerError(getMarketplaceErrorMessage(err));
        }
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [images, router],
  );

  const handleSubmit = useCallback(
    async (payload: ListingFormSubmitPayload) => {
      if (submittingRef.current) return;
      if (!('listingType' in payload)) return;
      pendingPayloadRef.current = payload;
      await publishListing(payload);
    },
    [publishListing],
  );

  const handleRetryUpload = useCallback(() => {
    if (submittingRef.current) return;
    if (pendingPayloadRef.current) {
      void publishListing(pendingPayloadRef.current);
    }
  }, [publishListing]);

  if (prefillLoading) {
    return <ListingLoadingView />;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: mp.cream }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        {...listingFormScrollProps}
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[
          listingFormScrollProps.contentContainerStyle,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
      >
        <ListingForm
          key={prefill?.id ?? 'new'}
          prefillFrom={prefill ?? undefined}
          images={images}
          onUploadRetry={handleRetryUpload}
          submitting={submitting}
          serverError={serverError}
          onSubmit={handleSubmit}
          submitLabel={marketplaceStrings.create.publish}
          submittingLabel={
            images.isUploading
              ? marketplaceStrings.images.uploading
              : marketplaceStrings.create.publishing
          }
        />
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
