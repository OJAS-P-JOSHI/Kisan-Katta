import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Snackbar, Text } from 'react-native-paper';

import { RemoteImage } from '@/components/media/RemoteImage';
import { radius, spacing } from '@/theme';

import { ExpiryBadge } from '../components/ExpiryBadge';
import { ListingLifecycleDialogs } from '../components/ListingLifecycleDialogs';
import { ListingEmptyView, ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { ListingStatusBadge } from '../components/ListingStatusBadge';
import { MyListingActionsMenu } from '../components/MyListingActionsMenu';
import { useListingLifecycleActions } from '../hooks/useListingLifecycleActions';
import { usePaginatedMyListings } from '../hooks/usePaginatedMyListings';
import { LISTING_STATUSES } from '../marketplace.constants';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { renewListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import { listingTypeAccent, listingTypeWash, mp, mpCard, mpPage } from '../marketplace.ui';
import type { ListingStatus, MarketplaceListing } from '../marketplace.types';
import {
  formatLabourRate,
  formatListingDate,
  formatPrice,
  getListingDisplayTitle,
  getListingExpiryDisplay,
  getListingImageUrl,
  isListingRenewable,
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => parseStatusParam(statusParam));
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [menuListingId, setMenuListingId] = useState<string | null>(null);
  const renewInFlightRef = useRef(false);
  const hasFocusedOnce = useRef(false);
  const statusParamKey = Array.isArray(statusParam) ? statusParam[0] : statusParam;
  const [seenStatusParam, setSeenStatusParam] = useState(statusParamKey);
  if (statusParamKey !== seenStatusParam) {
    setSeenStatusParam(statusParamKey);
    setStatusFilter(parseStatusParam(statusParam));
  }

  const {
    listings,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    replaceListing,
  } = usePaginatedMyListings(statusFilter);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      void refreshRef.current();
    }, []),
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
    onMarkedSold: refresh,
    onArchived: refresh,
  });

  const handleConfirmMarkSold = useCallback(async () => {
    const message = await confirmMarkSold();
    if (message) setSnackbar(message);
  }, [confirmMarkSold, setSnackbar]);

  const handleConfirmArchive = useCallback(async () => {
    const message = await confirmArchive();
    if (message) setSnackbar(message);
  }, [confirmArchive, setSnackbar]);

  const handleRenew = useCallback(
    async (listing: MarketplaceListing) => {
      if (renewInFlightRef.current || lifecycleLoading) return;
      renewInFlightRef.current = true;
      setRenewingId(listing.id);
      try {
        const updated = await renewListing(listing.id);
        replaceListing(updated);
        setSnackbar(marketplaceStrings.myListings.renewed);
      } catch (err) {
        setSnackbar(getMarketplaceErrorMessage(err));
      } finally {
        renewInFlightRef.current = false;
        setRenewingId(null);
      }
    },
    [lifecycleLoading, replaceListing],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

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
      const expiry = item.status === 'ACTIVE' ? getListingExpiryDisplay(item.expiresAt) : null;
      const canRenew = isListingRenewable(item);
      const busy = lifecycleLoading || renewingId === item.id;

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
                  <View style={styles.menuAnchor}>
                    <MyListingActionsMenu
                      listing={item}
                      visible={menuListingId === item.id}
                      disabled={busy}
                      onOpen={() => setMenuListingId(item.id)}
                      onDismiss={() => setMenuListingId(null)}
                      onEdit={() => router.push(`/marketplace-edit/${item.id}` as Href)}
                      onDuplicate={() =>
                        router.push(`/marketplace-create?from=${item.id}` as Href)
                      }
                      onMarkSold={() => openMarkSoldDialog(item.id, item.listingType)}
                      onArchive={() => openArchiveDialog(item.id, item.listingType)}
                    />
                  </View>
                </View>
                <Text style={styles.cardPrice} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                  {isLabour
                    ? formatLabourRate(item.price, item.rateType)
                    : formatPrice(item.price)}
                </Text>
                <Text style={styles.cardSub} numberOfLines={1} maxFontSizeMultiplier={1.4}>
                  {item.district} · {formatListingDate(item.createdAt)}
                </Text>
                {expiry ? <ExpiryBadge label={expiry.label} tone={expiry.tone} /> : null}
              </View>
            </View>

            {item.status === 'ACTIVE' && canRenew ? (
              <View style={styles.actions}>
                <Button
                  mode="contained"
                  compact
                  buttonColor={mp.primaryGreen}
                  textColor={mp.white}
                  onPress={() => void handleRenew(item)}
                  style={styles.renewButton}
                  disabled={busy}
                  loading={renewingId === item.id}
                >
                  {renewingId === item.id
                    ? marketplaceStrings.myListings.renewing
                    : marketplaceStrings.myListings.renew}
                </Button>
              </View>
            ) : null}
          </View>
        </View>
      );
    },
    [handleRenew, lifecycleLoading, menuListingId, openArchiveDialog, openMarkSoldDialog, renewingId, router],
  );

  const statusButtons: { value: StatusFilter; label: string }[] = [
    { value: 'ACTIVE', label: marketplaceStrings.myListings.active },
    { value: 'SOLD', label: marketplaceStrings.myListings.sold },
    { value: 'ARCHIVED', label: marketplaceStrings.myListings.archived },
  ];

  const filters = (
    <View style={styles.filterRow}>
      {statusButtons.map((btn) => {
        const active = statusFilter === btn.value;
        return (
          <Pressable
            key={btn.value}
            onPress={() => {
              setMenuListingId(null);
              setStatusFilter(btn.value);
            }}
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
  );

  if (loading && listings.length === 0 && !error) {
    return (
      <View style={mpPage}>
        {filters}
        <ListingLoadingView />
      </View>
    );
  }

  if (error && listings.length === 0) {
    return (
      <View style={mpPage}>
        {filters}
        <ListingErrorView
          title={marketplaceStrings.listings.errorTitle}
          message={error}
          onRetry={refresh}
        />
      </View>
    );
  }

  return (
    <View style={mpPage}>
      {filters}

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[mp.primaryGreen]} />
        }
        ListEmptyComponent={
          <ListingEmptyView
            title={marketplaceStrings.myListings.emptyTitle}
            message={marketplaceStrings.myListings.emptyMessage}
          />
        }
        ListHeaderComponent={
          error && listings.length > 0 ? (
            <View style={styles.inlineError}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#BA1A1A" />
              <Text variant="bodySmall" style={{ color: '#BA1A1A', flex: 1 }}>
                {error}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator animating color={mp.primaryGreen} />
              <Text variant="bodySmall" style={{ color: mp.bodyGrey }}>
                {marketplaceStrings.listings.loadMore}
              </Text>
            </View>
          ) : error && listings.length > 0 && hasMore ? (
            <Pressable onPress={loadMore} style={styles.footerRetry}>
              <Text variant="bodySmall" style={{ color: mp.primaryGreen, fontWeight: '700' }}>
                {marketplaceStrings.listings.loadMoreRetry}
              </Text>
            </Pressable>
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
    minHeight: 40,
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
  menuAnchor: { flexShrink: 0, marginTop: -6 },
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  actionButton: { borderRadius: 12, borderColor: mp.searchBorder },
  renewButton: { borderRadius: 12 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  footerRetry: { alignItems: 'center', paddingVertical: spacing.md },
});
