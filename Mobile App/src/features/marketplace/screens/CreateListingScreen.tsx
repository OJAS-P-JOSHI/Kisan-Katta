import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ListingForm, listingFormScrollProps, type ListingCreateSubmitPayload, type ListingFormSubmitPayload } from '../components/ListingForm';
import { MarketplaceImageUploadError, useListingImages } from '../hooks/useListingImages';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { createListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type ListingFormPayload = ListingCreateSubmitPayload;

export default function CreateListingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const images = useListingImages();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const pendingPayloadRef = useRef<ListingFormPayload | null>(null);

  const publishListing = useCallback(
    async (payload: ListingFormPayload) => {
      setSubmitting(true);
      setServerError(null);
      images.clearUploadError();

      try {
        const uploadedImages = await images.uploadAll();
        const listing = await createListing({ ...payload, images: uploadedImages });
        router.replace(`/marketplace-listing/${listing.id}` as Href);
      } catch (err) {
        if (!(err instanceof MarketplaceImageUploadError)) {
          setServerError(getMarketplaceErrorMessage(err));
        }
      } finally {
        setSubmitting(false);
      }
    },
    [images, router],
  );

  const handleSubmit = useCallback(
    async (payload: ListingFormSubmitPayload) => {
      if (!('listingType' in payload)) return;
      pendingPayloadRef.current = payload;
      await publishListing(payload);
    },
    [publishListing],
  );

  const handleRetryUpload = useCallback(() => {
    if (pendingPayloadRef.current) {
      void publishListing(pendingPayloadRef.current);
    }
  }, [publishListing]);

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
