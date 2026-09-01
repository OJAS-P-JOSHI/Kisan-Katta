import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/context/AuthContext';

import { ListingImageCarousel } from '../components/ListingImageCarousel';
import { ListingLifecycleDialogs } from '../components/ListingLifecycleDialogs';
import { ListingErrorView, ListingLoadingView } from '../components/ListingStateViews';
import { ListingStatusBadge } from '../components/ListingStatusBadge';
import { useListingLifecycleActions } from '../hooks/useListingLifecycleActions';
import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getListingById, recordContactClick } from '../marketplace.service';
import { getCategoryLabel, getGenderLabel, marketplaceStrings } from '../marketplace.strings';
import { listingTypeAccent, listingTypeWash, mp, mpCard } from '../marketplace.ui';
import type { MarketplaceListingDetail } from '../marketplace.types';
import {
  formatHarvestDateDisplay,
  formatLabourRate,
  formatListingDate,
  formatPhoneForDial,
  formatPhoneForWhatsApp,
  formatPrice,
  getLabourGroupLabel,
  getListingDisplayTitle,
  isListingOwner,
} from '../marketplace.utils';

export default function ListingDetailScreen() {
  const insets = useSafeAreaInsets();
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
    isLabour: lifecycleIsLabour,
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  } = useListingLifecycleActions({
    listingType: listing?.listingType,
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

  const title = getListingDisplayTitle(listing);
  const isOwner = isListingOwner(listing.sellerId, user?.userId);
  const isLabour = listing.listingType === 'labour';
  const accent = listingTypeAccent[listing.listingType];
  const wash = listingTypeWash[listing.listingType];
  const priceText = isLabour
    ? formatLabourRate(listing.price, listing.rateType)
    : formatPrice(listing.price);

  const factsFooter = (
    <View
      style={[
        styles.footer,
        {
          paddingBottom: Math.max(insets.bottom, 12) + 8,
          paddingLeft: 16 + Math.max(insets.left, 0),
          paddingRight: 16 + Math.max(insets.right, 0),
        },
      ]}
    >
      {isOwner ? (
        listing.status === 'ACTIVE' || listing.status === 'SOLD' ? (
          <View style={styles.footerActions}>
            {listing.status === 'ACTIVE' ? (
              <>
                <Button
                  mode="contained"
                  icon="pencil"
                  onPress={() => router.push(`/marketplace-edit/${listing.id}` as Href)}
                  buttonColor={mp.primaryGreen}
                  textColor={mp.white}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                >
                  {marketplaceStrings.detail.editListing}
                </Button>
                <Button
                  mode="outlined"
                  icon="check-circle-outline"
                  textColor={mp.headingGreen}
                  onPress={() => openMarkSoldDialog(listing.id, listing.listingType)}
                  style={styles.outlinedButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                >
                  {isLabour
                    ? marketplaceStrings.detail.markHired
                    : marketplaceStrings.detail.markSold}
                </Button>
                <Button
                  mode="outlined"
                  icon="archive-outline"
                  textColor="#BA1A1A"
                  onPress={() => openArchiveDialog(listing.id, listing.listingType)}
                  style={styles.outlinedButton}
                  contentStyle={styles.actionButtonContent}
                  disabled={lifecycleLoading}
                  loading={lifecycleLoading}
                >
                  {marketplaceStrings.detail.archive}
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => router.push(`/marketplace-edit/${listing.id}` as Href)}
                buttonColor={mp.primaryGreen}
                textColor={mp.white}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                {marketplaceStrings.detail.editListing}
              </Button>
            )}
          </View>
        ) : null
      ) : (
        <View style={styles.contactBlock}>
          <Text style={styles.contactHint} maxFontSizeMultiplier={1.4}>
            {marketplaceStrings.detail.contactHint}
          </Text>
          <View style={styles.contactRow}>
            <Button
              mode="contained"
              icon="phone"
              onPress={handleCallSeller}
              buttonColor={mp.primaryGreen}
              textColor={mp.white}
              style={[styles.actionButton, styles.contactBtn]}
              contentStyle={styles.actionButtonContent}
              loading={contactLoading}
              disabled={contactLoading}
            >
              {marketplaceStrings.detail.callSeller}
            </Button>
            <Button
              mode="contained"
              icon="whatsapp"
              onPress={handleWhatsAppSeller}
              buttonColor={mp.whatsapp}
              textColor={mp.white}
              style={[styles.actionButton, styles.contactBtn]}
              contentStyle={styles.actionButtonContent}
              loading={contactLoading}
              disabled={contactLoading}
            >
              {marketplaceStrings.detail.whatsappSeller}
            </Button>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ListingImageCarousel images={listing.images} listingType={listing.listingType} />

        <View style={styles.body}>
          <View style={[styles.heroCard, mpCard]}>
            <View style={[styles.typePill, { backgroundColor: wash }]}>
              <Text style={[styles.typePillText, { color: accent }]} maxFontSizeMultiplier={1.3}>
                {isLabour
                  ? marketplaceStrings.create.labour
                  : listing.listingType === 'product'
                    ? marketplaceStrings.create.product
                    : marketplaceStrings.create.produce}
              </Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title} maxFontSizeMultiplier={1.5}>
                {title}
              </Text>
              <ListingStatusBadge
                status={listing.status}
                listingType={listing.listingType}
                compact={false}
              />
            </View>

            {isOwner && listing.status === 'SOLD' ? (
              <Text style={styles.statusNote} maxFontSizeMultiplier={1.5}>
                {isLabour
                  ? marketplaceStrings.detail.hiredMessage
                  : marketplaceStrings.detail.soldMessage}
              </Text>
            ) : null}

            {isOwner && listing.status === 'ARCHIVED' ? (
              <Text style={styles.statusNote} maxFontSizeMultiplier={1.5}>
                {marketplaceStrings.detail.archivedMessage}
              </Text>
            ) : null}

            <Text style={styles.price} maxFontSizeMultiplier={1.4}>
              {priceText}
            </Text>
          </View>

          <View style={[styles.sectionCard, mpCard]}>
            {isLabour ? (
              <>
                <DetailRow
                  label={marketplaceStrings.detail.category}
                  value={getCategoryLabel(listing.category)}
                />
                {listing.availableWorkers != null ? (
                  <DetailRow
                    label={marketplaceStrings.detail.availableWorkers}
                    value={`${listing.availableWorkers} (${
                      getLabourGroupLabel(listing.availableWorkers) === 'Individual'
                        ? marketplaceStrings.detail.individual
                        : marketplaceStrings.detail.group
                    })`}
                  />
                ) : null}
                {listing.gender ? (
                  <DetailRow
                    label={marketplaceStrings.detail.gender}
                    value={getGenderLabel(listing.gender)}
                  />
                ) : null}
                {listing.availableFrom ? (
                  <DetailRow
                    label={marketplaceStrings.detail.availableFrom}
                    value={formatHarvestDateDisplay(listing.availableFrom)}
                  />
                ) : null}
              </>
            ) : (
              <>
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

                {listing.harvestDate ? (
                  <DetailRow
                    label={marketplaceStrings.detail.harvestDate}
                    value={formatHarvestDateDisplay(listing.harvestDate)}
                  />
                ) : null}

                <DetailRow
                  label={marketplaceStrings.detail.category}
                  value={getCategoryLabel(listing.category)}
                />
              </>
            )}
          </View>

          {listing.description ? (
            <View style={[styles.sectionCard, mpCard]}>
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.5}>
                {marketplaceStrings.detail.description}
              </Text>
              <Text style={styles.bodyText} maxFontSizeMultiplier={1.5}>
                {listing.description}
              </Text>
            </View>
          ) : null}

          <View style={[styles.sectionCard, mpCard]}>
            <View style={styles.locationHead}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={mp.primaryGreen} />
              <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.5}>
                {marketplaceStrings.create.sections.location}
              </Text>
            </View>
            {isLabour && listing.village ? (
              <DetailRow label={marketplaceStrings.detail.village} value={listing.village} />
            ) : null}
            {isLabour && listing.taluka ? (
              <DetailRow label={marketplaceStrings.detail.taluka} value={listing.taluka} />
            ) : null}
            <DetailRow label={marketplaceStrings.detail.district} value={listing.district} />
            <DetailRow
              label={marketplaceStrings.detail.posted}
              value={formatListingDate(listing.createdAt)}
            />
          </View>

          {!isOwner ? (
            <View style={[styles.sectionCard, mpCard]}>
              <View style={styles.locationHead}>
                <MaterialCommunityIcons name="account-outline" size={18} color={mp.primaryGreen} />
                <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.5}>
                  {marketplaceStrings.detail.seller}
                </Text>
              </View>
              <DetailRow label={marketplaceStrings.detail.seller} value={listing.seller.name} />
              <DetailRow label={marketplaceStrings.detail.phone} value={listing.seller.phone} />
            </View>
          ) : (
            <Text style={styles.ownerActionsLabel} maxFontSizeMultiplier={1.5}>
              {marketplaceStrings.detail.ownerActions}
            </Text>
          )}
        </View>
      </ScrollView>

      {isOwner && listing.status !== 'ACTIVE' && listing.status !== 'SOLD' ? null : factsFooter}

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel} maxFontSizeMultiplier={1.4}>
        {label}
      </Text>
      <Text style={styles.detailValue} maxFontSizeMultiplier={1.5}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mp.cream },
  container: { flex: 1 },
  content: { paddingBottom: 8 },
  body: { padding: 16, gap: 12 },
  heroCard: { padding: 16, gap: 8 },
  typePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typePillText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minWidth: 0 },
  title: {
    flex: 1,
    minWidth: 0,
    color: mp.headingGreen,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusNote: { color: mp.bodyGrey, fontSize: 14, lineHeight: 20 },
  price: {
    color: mp.primaryGreen,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCard: { padding: 16, gap: 10 },
  sectionTitle: {
    color: mp.headingGreen,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  bodyText: { color: mp.tagline, fontSize: 15, lineHeight: 22 },
  locationHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    minWidth: 0,
  },
  detailLabel: {
    color: mp.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    flexShrink: 0,
    maxWidth: '42%',
  },
  detailValue: {
    color: mp.headingGreen,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  ownerActionsLabel: {
    color: mp.headingGreen,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mp.cardLine,
    backgroundColor: mp.cream,
    paddingTop: 10,
  },
  footerActions: { gap: 8 },
  contactBlock: { gap: 6 },
  contactHint: { color: mp.bodyGrey, fontSize: 12, lineHeight: 16, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, minWidth: 0 },
  actionButton: { borderRadius: 14 },
  outlinedButton: { borderRadius: 14, borderColor: mp.searchBorder },
  actionButtonContent: { minHeight: 48, paddingVertical: 4 },
});
