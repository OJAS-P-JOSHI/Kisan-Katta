import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { marketplaceStrings } from '@/features/marketplace/marketplace.strings';
import type { ListingStatus, MyMarketplaceSummary } from '@/features/marketplace/marketplace.types';
import {
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { homeColors, homeSurfaces, homeText } from '../home.theme';

type MyMarketplaceCardProps = {
  summary: MyMarketplaceSummary;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

type StatTone = 'active' | 'sold' | 'archived' | 'saved';

type StatConfig = {
  icon: 'store-check-outline' | 'check-circle-outline' | 'archive-outline' | 'bookmark-outline';
  accent: string;
  wash: string;
};

const STAT_CONFIG: Record<StatTone, StatConfig> = {
  active: { icon: 'store-check-outline', accent: palette.green700, wash: palette.green50 },
  sold: { icon: 'check-circle-outline', accent: palette.blue800, wash: palette.blue100 },
  archived: { icon: 'archive-outline', accent: palette.steel, wash: homeColors.utilityMuted },
  saved: { icon: 'bookmark-outline', accent: palette.amber700, wash: palette.amber100 },
};

const copy = marketplaceStrings.homeSummary;

function StatCell({
  tone,
  label,
  value,
  onPress,
  showDivider,
}: {
  tone: StatTone;
  label: string;
  value: number;
  onPress: () => void;
  showDivider?: boolean;
}) {
  const config = STAT_CONFIG[tone];

  return (
    <>
      {showDivider ? <View style={styles.statDivider} /> : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        style={({ pressed }) => [styles.statCell, pressed && styles.pressed]}
      >
        <View style={[styles.statIconWrap, { backgroundColor: config.wash }]}>
          <MaterialCommunityIcons name={config.icon} size={16} color={config.accent} />
        </View>
        <Text style={[styles.statValue, { color: palette.ink }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: homeColors.inkMuted }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </>
  );
}

export const MyMarketplaceCard = memo(function MyMarketplaceCard({
  summary,
  loading,
  error,
  onRetry,
}: MyMarketplaceCardProps) {
  const theme = useAppTheme();
  const router = useRouter();

  const ownedTotal = summary.active + summary.sold + summary.archived;
  const hasNoListings = ownedTotal === 0;

  const openMyListings = useCallback(
    (status?: ListingStatus) => {
      const href = status
        ? (`/marketplace-my-listings?status=${status}` as Href)
        : ('/marketplace-my-listings' as Href);
      router.push(href);
    },
    [router],
  );

  const openSaved = useCallback(() => {
    router.push('/marketplace-saved' as Href);
  }, [router]);

  const openCreate = useCallback(() => {
    router.push('/marketplace-create' as Href);
  }, [router]);

  const header = (
    <View style={styles.headerBand}>
      <View style={styles.headerMain}>
        <View style={[styles.headerIcon, { backgroundColor: palette.green50 }]}>
          <MaterialCommunityIcons name="storefront-outline" size={iconSize.md} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[homeText.sectionPrimary, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {copy.title}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]} numberOfLines={2}>
            {copy.subtitle}
          </Text>
        </View>
      </View>
      {!hasNoListings ? (
        <View style={[styles.totalPill, { backgroundColor: homeColors.heroAccentSoft }]}>
          <Text style={[styles.totalPillText, { color: theme.colors.primary }]}>
            {ownedTotal}
          </Text>
          <Text style={[styles.totalPillLabel, { color: homeColors.inkMuted }]}>जाहिराती</Text>
        </View>
      ) : null}
    </View>
  );

  if (loading && ownedTotal === 0 && summary.saved === 0 && !error) {
    return (
      <View style={[styles.shell, homeSurfaces.primary]}>
        {header}
        <View style={styles.loadingRow}>
          <ActivityIndicator animating color={theme.colors.primary} />
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
            {copy.loading}
          </Text>
        </View>
      </View>
    );
  }

  if (error && ownedTotal === 0 && summary.saved === 0) {
    return (
      <View style={[styles.shell, homeSurfaces.primary, styles.errorContent]}>
        <MaterialCommunityIcons name="storefront-outline" size={iconSize.md} color={theme.colors.error} />
        <Text style={[typography.body, styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
          {error}
        </Text>
        <Button compact mode="text" onPress={onRetry}>
          {marketplaceStrings.listings.retry}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.shell, homeSurfaces.primary]}>
      {header}

      {hasNoListings ? (
        <View style={styles.emptyBlock}>
          <View style={[styles.emptyIcon, { backgroundColor: homeColors.utilityMuted }]}>
            <MaterialCommunityIcons name="plus-box-outline" size={28} color={theme.colors.primary} />
          </View>
          <Text style={[typography.body, styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {copy.emptyTitle}
          </Text>
          <Button
            mode="contained"
            onPress={openCreate}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
            icon="plus"
          >
            {copy.createFirst}
          </Button>
          {summary.saved > 0 ? (
            <Pressable
              onPress={openSaved}
              accessibilityRole="button"
              style={({ pressed }) => [styles.savedOnlyRow, pressed && styles.pressed]}
            >
              <View style={styles.savedOnlyLeft}>
                <View style={[styles.statIconWrap, { backgroundColor: palette.amber100 }]}>
                  <MaterialCommunityIcons name="bookmark-outline" size={16} color={palette.amber700} />
                </View>
                <Text style={[styles.statLabel, { color: homeColors.inkMuted }]}>{copy.saved}</Text>
              </View>
              <Text style={[styles.statValue, { color: palette.ink }]}>{summary.saved}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <View style={styles.statsStrip}>
            <StatCell
              tone="active"
              label={copy.active}
              value={summary.active}
              onPress={() => openMyListings('ACTIVE')}
            />
            <StatCell
              tone="sold"
              label={copy.sold}
              value={summary.sold}
              onPress={() => openMyListings('SOLD')}
              showDivider
            />
            <StatCell
              tone="archived"
              label={copy.archived}
              value={summary.archived}
              onPress={() => openMyListings('ARCHIVED')}
              showDivider
            />
            <StatCell
              tone="saved"
              label={copy.saved}
              value={summary.saved}
              onPress={openSaved}
              showDivider
            />
          </View>

          <Pressable
            onPress={() => openMyListings()}
            accessibilityRole="button"
            accessibilityLabel={copy.viewAll}
            style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
            hitSlop={8}
          >
            <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>{copy.viewAll}</Text>
            <MaterialCommunityIcons name="arrow-right" size={iconSize.sm} color={theme.colors.primary} />
          </Pressable>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  headerBand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: homeColors.sandInset,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: homeColors.divider,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  totalPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    minWidth: 52,
  },
  totalPillText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  totalPillLabel: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 11,
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    minHeight: 72,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: homeColors.divider,
    marginVertical: spacing.sm,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  viewAll: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: homeColors.heroAccentSoft,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    borderRadius: radius.md,
    alignSelf: 'stretch',
  },
  createButtonContent: {
    minHeight: 44,
  },
  savedOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.amber100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(201, 162, 39, 0.25)',
  },
  savedOnlyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 80,
    padding: spacing.md,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorText: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },
});
