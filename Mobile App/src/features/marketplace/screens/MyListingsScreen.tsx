import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { radius, spacing } from '@/theme';

import { ListingLifecycleDialogs } from '../components/ListingLifecycleDialogs';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { ListingStatusBadge } from '../components/ListingStatusBadge';
import { useListingLifecycleActions } from '../hooks/useListingLifecycleActions';
import { LISTING_STATUSES } from '../marketplace.constants';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getMyListings } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import { listingTypeAccent, listingTypeWash, mp, mpCard, mpPage } from '../marketplace.ui';
import type { ListingStatus, MarketplaceListing } from '../marketplace.types';
import {
  formatLabourRate,
  formatListingDate,
  formatPrice,
  getListingDisplayTitle,
  getListingImageUrl,
} from '../marketplace.utils';

type StatusFilter = ListingStatus;

const parseStatusParam = (value: string | string[] | undefined): StatusFilter => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (LISTING_STATUSES as readonly string[]).includes(raw)) {
    return raw as StatusFilter;
  }
  return 'ACTIVE';
};

export default function MyListingsScreen() {
  const router = useRouter();
  const { status: statusParam } = useLocalSearchParams<{ status?: string }>();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => parseStatusParam(statusParam));
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    setStatusFilter(parseStatusParam(statusParam));
  }, [statusParam]);

  const fetchListings = useCallback(async () => {
    try {
      setError(null);
      const result = await getMyListings();
      setListings(result.listings);
    } catch (err) {
      setError(getMarketplaceErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchListings().finally(() => setLoading(false));
    }, [fetchListings]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings().finally(() => setRefreshing(false));
  }, [fetchListings]);

  const filteredListings = useMemo(
    () => listings.filter((listing) => listing.status === statusFilter),
    [listings, statusFilter],
  );

  const {
    dialog,
    loading: lifecycleLoading,
    isLabour: lifecycleIsLabour,
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  } = useListingLifecycleActions({
    onMarkedSold: fetchListings,
    onArchived: fetchListings,
  });

  const handleConfirmMarkSold = useCallback(async () => {
    const message = await confirmMarkSold();
    if (message) setSnackbar(message);
  }, [confirmMarkSold]);

  const handleConfirmArchive = useCallback(async () => {
    const message = await confirmArchive();
    if (message) setSnackbar(message);
  }, [confirmArchive]);

  const renderItem = useCallback(
    ({ item }: { item: MarketplaceListing }) => {
      const isLabour = item.listingType === 'labour';
      const imageUrl = getListingImageUrl(item.images);
      const accent = listingTypeAccent[item.listingType];
      const wash = listingTypeWash[item.listingType];
      const placeholderIcon =
        item.listingType === 'produce'
          ? 'sprout'
          : item.listingType === 'labour'
            ? 'account-hard-hat'
            : 'package-variant';

      return (
          <View style={[styles.card, mpCard]}>
            <View style={[styles.accent, { backgroundColor: accent }]} />
            <View style={styles.cardInner}>
              <View style={styles.cardTop}>
                <View style={styles.thumb}>
                  {imageUrl ? (
                    <RemoteImage
                      uri={imageUrl}
                      displayWidth={240}
                      style={styles.thumbImage}
                      containerStyle={styles.thumbFill}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.thumbFill, styles.thumbFallback, { backgroundColor: wash }]}>
                      <MaterialCommunityIcons name={placeholderIcon} size={28} color={accent} />
                    </View>
                  )}
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.headerRow}>
                    <Text style={styles.cardTitle} numberOfLines={2} maxFontSizeMultiplier={1.5}>
                      {getListingDisplayTitle(item)}
                    </Text>
                    <ListingStatusBadge status={item.status} listingType={item.listingType} />
                  </View>
                  <Text style={styles.cardPrice} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                    {isLabour
                      ? formatLabourRate(item.price, item.rateType)
                      : formatPrice(item.price)}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                    {item.district} · {formatListingDate(item.createdAt)}
                  </Text>
                </View>
              </View>

              {item.status === 'ACTIVE' ? (
                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    compact
                    textColor={mp.headingGreen}
                    onPress={() => router.push(`/marketplace-edit/${item.id}` as Href)}
                    style={styles.actionButton}
                    disabled={lifecycleLoading}
                  >
                    {marketplaceStrings.myListings.edit}
                  </Button>
                  <Button
                    mode="outlined"
                    compact
                    textColor={mp.headingGreen}
                    onPress={() => openMarkSoldDialog(item.id, item.listingType)}
                    style={styles.actionButton}
                    disabled={lifecycleLoading}
                  >
                    {isLabour
                      ? marketplaceStrings.myListings.markHired
                      : marketplaceStrings.myListings.markSold}
                  </Button>
                  <Button
                    mode="text"
                    compact
                    textColor="#BA1A1A"
                    onPress={() => openArchiveDialog(item.id, item.listingType)}
                    disabled={lifecycleLoading}
                  >
                    {marketplaceStrings.myListings.archive}
                  </Button>
                </View>
              ) : null}

              {item.status === 'SOLD' ? (
                <View style={styles.actions}>
                  <Button
                    mode="outlined"
                    compact
                    textColor={mp.headingGreen}
                    onPress={() => router.push(`/marketplace-edit/${item.id}` as Href)}
                    style={styles.actionButton}
                  >
                    {marketplaceStrings.myListings.edit}
                  </Button>
                </View>
              ) : null}
            </View>
          </View>
      );
    },
    [lifecycleLoading, openArchiveDialog, openMarkSoldDialog, router],
  );

  const statusButtons: { value: StatusFilter; label: string }[] = [
    { value: 'ACTIVE', label: marketplaceStrings.myListings.active },
    { value: 'SOLD', label: marketplaceStrings.myListings.sold },
    { value: 'ARCHIVED', label: marketplaceStrings.myListings.archived },
  ];

  if (loading && listings.length === 0) {
    return <ListingLoadingView />;
  }

  if (error && listings.length === 0) {
    return (
      <ListingErrorView
        title={marketplaceStrings.listings.errorTitle}
        message={error}
        onRetry={fetchListings}
      />
    );
  }

  return (
    <View style={mpPage}>
      <View style={styles.filterRow}>
        {statusButtons.map((btn) => {
          const active = statusFilter === btn.value;
          return (
            <Pressable
              key={btn.value}
              onPress={() => setStatusFilter(btn.value)}
              style={[styles.filterChip, active ? styles.filterChipActive : null]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.filterLabel, active ? styles.filterLabelActive : null]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {btn.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[mp.primaryGreen]} />
        }
        ListEmptyComponent={
          <ListingEmptyView
            title={marketplaceStrings.myListings.emptyTitle}
            message={marketplaceStrings.myListings.emptyMessage}
          />
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.inlineError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#BA1A1A" />
              <Text variant="bodySmall" style={{ color: '#BA1A1A', flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null
        }
      />

      <ListingLifecycleDialogs
        dialog={dialog}
        loading={lifecycleLoading}
        isLabour={lifecycleIsLabour}
        onDismiss={closeDialog}
        onConfirmMarkSold={handleConfirmMarkSold}
        onConfirmArchive={handleConfirmArchive}
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mp.searchBorder,
    backgroundColor: mp.white,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: mp.produceBg,
    borderColor: 'rgba(0, 106, 44, 0.22)',
  },
  filterLabel: {
    color: mp.tagline,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  filterLabelActive: {
    color: mp.primaryGreen,
  },
  listContent: { padding: 16, paddingTop: 4, gap: 12, flexGrow: 1 },
  card: { overflow: 'hidden' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  cardInner: { padding: 14, paddingLeft: 18, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12, minWidth: 0 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbFill: { width: '100%', height: '100%' },
  thumbImage: { width: '100%', height: '100%' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1, minWidth: 0, gap: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minWidth: 0 },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    color: mp.headingGreen,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
  },
  cardPrice: { color: mp.primaryGreen, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  cardSub: { color: mp.bodyGrey, fontSize: 12, lineHeight: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { borderRadius: 12, borderColor: mp.searchBorder },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
});
