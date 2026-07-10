import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text } from 'react-native-paper';

import { useAuth } from '@/features/auth/context/AuthContext';
import { radius, spacing, useAppTheme } from '@/theme';

import { ListingLifecycleDialogs } from '../components/ListingLifecycleDialogs';
import { ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { ListingStatusBadge } from '../components/ListingStatusBadge';
import { useListingLifecycleActions } from '../hooks/useListingLifecycleActions';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListingById, recordContactClick } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListingDetail } from '../marketplace.types';
import {
  formatListingDate,
  formatPhoneForDial,
  formatPhoneForWhatsApp,
  formatPrice,
  getListingDisplayTitle,
  getListingImageUrl,
  isListingOwner,
} from '../marketplace.utils';

export default function ListingDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  const fetchListing = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError(marketplaceStrings.errors.generic);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await getListingById(id);
      setListing(data);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void fetchListing();
    }, [fetchListing]),
  );

  const {
    dialog,
    loading: lifecycleLoading,
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  } = useListingLifecycleActions({
    onMarkedSold: fetchListing,
  });

  const handleConfirmMarkSold = useCallback(async () => {
    const message = await confirmMarkSold();
    if (message) setSnackbar(message);
  }, [confirmMarkSold]);

  const handleConfirmArchive = useCallback(async () => {
    const message = await confirmArchive();
    if (message) {
      setSnackbar(message);
      setTimeout(() => router.back(), 1500);
    }
  }, [confirmArchive, router]);

  const trackContact = useCallback(async (listingId: string) => {
    try {
      await recordContactClick(listingId);
    } catch {
      // Contact tracking should not block the user from reaching the seller.
    }
  }, []);

  const handleCallSeller = useCallback(async () => {
    if (!listing || contactLoading) return;

    setContactLoading(true);
    try {
      await trackContact(listing.id);
      const phone = formatPhoneForDial(listing.seller.phone);
      await Linking.openURL(`tel:${phone}`);
    } catch {
      setSnackbar(marketplaceStrings.errors.generic);
    } finally {
      setContactLoading(false);
    }
  }, [contactLoading, listing, trackContact]);

  const handleWhatsAppSeller = useCallback(async () => {
    if (!listing || contactLoading) return;

    setContactLoading(true);
    try {
      await trackContact(listing.id);
      const waUrl = `https://wa.me/${formatPhoneForWhatsApp(listing.seller.phone)}`;
      const canOpen = await Linking.canOpenURL(waUrl);
      if (!canOpen) {
        setSnackbar(marketplaceStrings.lifecycle.whatsappUnavailable);
        return;
      }
      await Linking.openURL(waUrl);
    } catch {
      setSnackbar(marketplaceStrings.lifecycle.whatsappUnavailable);
    } finally {
      setContactLoading(false);
    }
  }, [contactLoading, listing, trackContact]);

  if (loading && !listing) {
    return <ListingLoadingView message={marketplaceStrings.detail.loading} />;
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

  const imageUrl = getListingImageUrl(listing.images);
  const title = getListingDisplayTitle(listing);
  const isOwner = isListingOwner(listing.sellerId, user?.userId);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.imageWrap, { backgroundColor: theme.colors.surfaceVariant }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons
              name={listing.listingType === 'produce' ? 'barley' : 'package-variant'}
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, flex: 1 }}>
                {title}
              </Text>
              <ListingStatusBadge status={listing.status} compact={false} />
            </View>

            {isOwner && listing.status === 'SOLD' ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {marketplaceStrings.detail.soldMessage}
              </Text>
            ) : null}

            {isOwner && listing.status === 'ARCHIVED' ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {marketplaceStrings.detail.archivedMessage}
              </Text>
            ) : null}

            <Text variant="headlineMedium" style={{ color: theme.colors.primary, marginTop: spacing.sm }}>
              {formatPrice(listing.price)}
            </Text>

            {listing.quantity != null && listing.unit ? (
              <DetailRow
                label={marketplaceStrings.detail.quantity}
                value={`${listing.quantity} ${listing.unit}`}
              />
            ) : null}

            {listing.brand ? (
              <DetailRow label={marketplaceStrings.detail.brand} value={listing.brand} />
            ) : null}

            {listing.stock != null ? (
              <DetailRow label={marketplaceStrings.detail.stock} value={String(listing.stock)} />
            ) : null}

            <DetailRow label={marketplaceStrings.detail.category} value={listing.category} />

            {listing.description ? (
              <>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
                <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                  {marketplaceStrings.detail.description}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {listing.description}
                </Text>
              </>
            ) : null}

            {!isOwner ? (
              <>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
                <DetailRow label={marketplaceStrings.detail.seller} value={listing.seller.name} />
                <DetailRow label={marketplaceStrings.detail.district} value={listing.district} />
                <DetailRow label={marketplaceStrings.detail.phone} value={listing.seller.phone} />
              </>
            ) : null}

            <DetailRow
              label={marketplaceStrings.detail.posted}
              value={formatListingDate(listing.createdAt)}
            />
          </Card.Content>
        </Card>

        {isOwner ? (
          <View style={styles.actions}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {marketplaceStrings.detail.ownerActions}
            </Text>

            {listing.status === 'ACTIVE' ? (
              <>
                <Button
                  mode="contained"
                  icon="pencil"
                  onPress={() => router.push(`/marketplace-edit/${listing.id}` as Href)}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                >
                  {marketplaceStrings.create.editTitle}
                </Button>
                <Button
                  mode="outlined"
                  icon="check-circle-outline"
                  onPress={() => openMarkSoldDialog(listing.id)}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                >
                  {marketplaceStrings.create.markSold}
                </Button>
                <Button
                  mode="outlined"
                  icon="archive-outline"
                  textColor={theme.colors.error}
                  onPress={() => openArchiveDialog(listing.id)}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                  loading={lifecycleLoading}
                >
                  {marketplaceStrings.create.archive}
                </Button>
              </>
            ) : null}

            {listing.status === 'SOLD' ? (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => router.push(`/marketplace-edit/${listing.id}` as Href)}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                {marketplaceStrings.create.editTitle}
              </Button>
            ) : null}
          </View>
        ) : (
          <View style={styles.actions}>
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCallSeller}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              loading={contactLoading}
              disabled={contactLoading}
            >
              {marketplaceStrings.detail.callSeller}
            </Button>
            <Button
              mode="outlined"
              icon="whatsapp"
              onPress={handleWhatsAppSeller}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              loading={contactLoading}
              disabled={contactLoading}
            >
              {marketplaceStrings.detail.whatsappSeller}
            </Button>
          </View>
        )}
      </ScrollView>

      <ListingLifecycleDialogs
        dialog={dialog}
        loading={lifecycleLoading}
        onDismiss={closeDialog}
        onConfirmMarkSold={handleConfirmMarkSold}
        onConfirmArchive={handleConfirmArchive}
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  card: { borderRadius: radius.lg },
  cardContent: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  divider: { marginVertical: spacing.sm },
  detailRow: { gap: spacing.xs },
  actions: { gap: spacing.sm },
  actionButton: { borderRadius: radius.md },
  actionButtonContent: { paddingVertical: spacing.xs },
});
