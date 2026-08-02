import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { memo, useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Text } from 'react-native-paper';

import { marketplaceStrings } from '@/features/marketplace/marketplace.strings';
import type { ListingStatus, MyMarketplaceSummary } from '@/features/marketplace/marketplace.types';
import {
  cardSurface,
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

type MyMarketplaceCardProps = {
  summary: MyMarketplaceSummary;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

type StatTone = 'active' | 'sold' | 'archived' | 'saved';

const STAT_TONES: Record<StatTone, { dot: string; iconBg: string }> = {
  active: { dot: palette.green700, iconBg: palette.green50 },
  sold: { dot: palette.blue800, iconBg: palette.blue100 },
  archived: { dot: palette.steel, iconBg: palette.mist },
  saved: { dot: palette.red700, iconBg: palette.red100 },
};

const copy = marketplaceStrings.homeSummary;

function StatCell({
  tone,
  label,
  value,
  onPress,
}: {
  tone: StatTone;
  label: string;
  value: number;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const colors = STAT_TONES[tone];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.statCell,
        { backgroundColor: colors.iconBg, borderColor: theme.colors.outlineVariant },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.statLabelRow}>
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
        <Text
          style={[typography.caption, styles.statLabel, { color: theme.colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Text style={[typography.sectionTitle, styles.statValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
    </Pressable>
  );
}

/**
 * Home dashboard card — Marketplace activity counts only.
 * Navigates into existing My Listings / Saved / Create screens.
 */
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
    <View style={styles.header}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name="storefront-outline" size={iconSize.md} color={theme.colors.primary} />
      </View>
      <View style={styles.titleBlock}>
        <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {copy.title}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
          {copy.subtitle}
        </Text>
      </View>
    </View>
  );

  if (loading && ownedTotal === 0 && summary.saved === 0 && !error) {
    return (
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.loadingContent}>
          {header}
          <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.loadingRow}>
            <ActivityIndicator animating color={theme.colors.primary} />
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {copy.loading}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  if (error && ownedTotal === 0 && summary.saved === 0) {
    return (
      <Card mode="elevated" style={[styles.card, cardSurface]}>
        <Card.Content style={styles.errorContent}>
          <MaterialCommunityIcons name="storefront-outline" size={iconSize.md} color={theme.colors.error} />
          <Text style={[typography.body, styles.errorText, { color: theme.colors.onSurfaceVariant }]}>
            {error}
          </Text>
          <Button compact mode="text" onPress={onRetry}>
            {marketplaceStrings.listings.retry}
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content style={styles.content}>
        {header}

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        {hasNoListings ? (
          <View style={styles.emptyBlock}>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {copy.emptyTitle}
            </Text>
            <Button
              mode="contained"
              onPress={openCreate}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
            >
              {copy.createFirst}
            </Button>
            {summary.saved > 0 ? (
              <Pressable
                onPress={openSaved}
                accessibilityRole="button"
                style={({ pressed }) => [styles.savedOnlyRow, pressed && styles.pressed]}
              >
                <View style={styles.statLabelRow}>
                  <View style={[styles.dot, { backgroundColor: STAT_TONES.saved.dot }]} />
                  <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                    {copy.saved}
                  </Text>
                </View>
                <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
                  {summary.saved}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.grid}>
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
              />
              <StatCell
                tone="archived"
                label={copy.archived}
                value={summary.archived}
                onPress={() => openMyListings('ARCHIVED')}
              />
              <StatCell
                tone="saved"
                label={copy.saved}
                value={summary.saved}
                onPress={openSaved}
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
              <MaterialCommunityIcons name="chevron-right" size={iconSize.sm} color={theme.colors.primary} />
            </Pressable>
          </>
        )}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  content: {
    paddingVertical: spacing.md,
  },
  loadingContent: {
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 3, minWidth: 0 },
  divider: { marginVertical: spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCell: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    minHeight: 64,
    justifyContent: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  statLabel: {
    flex: 1,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  viewAll: {
    marginTop: spacing.md,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBlock: {
    gap: spacing.md,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: palette.red100,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88 },
});
