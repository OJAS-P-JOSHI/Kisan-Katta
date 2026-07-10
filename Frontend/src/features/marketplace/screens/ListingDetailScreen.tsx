import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListingById } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListingDetail } from '../marketplace.types';
import {
  formatListingDate,
  formatPrice,
  getListingDisplayTitle,
  getListingImageUrl,
} from '../marketplace.utils';

export default function ListingDetailScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<MarketplaceListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleCallSeller = useCallback(() => {
    // TODO: Implement phone call via Linking.openURL(`tel:${listing?.seller.phone}`)
  }, []);

  const handleWhatsAppSeller = useCallback(() => {
    // TODO: Implement WhatsApp via Linking.openURL(`whatsapp://send?phone=...`)
  }, []);

  if (loading) {
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

  return (
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
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
            {title}
          </Text>

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

          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <DetailRow label={marketplaceStrings.detail.seller} value={listing.seller.name} />
          <DetailRow label={marketplaceStrings.detail.district} value={listing.district} />
          <DetailRow label={marketplaceStrings.detail.phone} value={listing.seller.phone} />
          <DetailRow
            label={marketplaceStrings.detail.posted}
            value={formatListingDate(listing.createdAt)}
          />
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="phone"
          onPress={handleCallSeller}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          {marketplaceStrings.detail.callSeller}
        </Button>
        <Button
          mode="outlined"
          icon="whatsapp"
          onPress={handleWhatsAppSeller}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          {marketplaceStrings.detail.whatsappSeller}
        </Button>
      </View>
    </ScrollView>
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
  divider: { marginVertical: spacing.sm },
  detailRow: { gap: spacing.xs },
  actions: { gap: spacing.sm },
  actionButton: { borderRadius: radius.md },
  actionButtonContent: { paddingVertical: spacing.xs },
});
