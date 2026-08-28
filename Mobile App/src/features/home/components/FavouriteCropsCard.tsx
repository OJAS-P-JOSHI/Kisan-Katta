import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getCropDisplayParts, getCropEmoji } from '@/features/market/market.translate';
import { iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { homeColors, homeSurfaces, homeText } from '../home.theme';

type FavouriteCropsCardProps = {
  /** All profile favourite crops — never filtered by market availability. */
  crops: readonly string[];
  loading: boolean;
};

const FavouriteCropChip = memo(function FavouriteCropChip({ crop }: { crop: string }) {
  const parts = useMemo(() => getCropDisplayParts(crop), [crop]);
  const emoji = useMemo(() => getCropEmoji(crop), [crop]);

  return (
    <View style={styles.chip}>
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={styles.chipMr} numberOfLines={1}>
        {parts.marathi}
      </Text>
    </View>
  );
});

export const FavouriteCropsCard = memo(function FavouriteCropsCard({
  crops,
  loading,
}: FavouriteCropsCardProps) {
  const theme = useAppTheme();

  const subtitle = useMemo(() => {
    if (crops.length === 0) return strings.home.cropsSubtitleEmpty;
    return strings.home.cropsSubtitleCount(crops.length);
  }, [crops.length]);

  return (
    <View style={[styles.card, homeSurfaces.utility]}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: homeColors.heroAccentSoft }]}>
          <MaterialCommunityIcons name="heart-outline" size={iconSize.sm} color={theme.colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[homeText.sectionUtility, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {strings.home.cropsTitle}
          </Text>
          <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, fontSize: 11 }]} numberOfLines={2}>
            {loading ? strings.home.cropsLoading : subtitle}
          </Text>
        </View>
        {crops.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: palette.green50 }]}>
            <Text style={[styles.countText, { color: theme.colors.primary }]}>{crops.length}</Text>
          </View>
        ) : null}
      </View>

      {loading && crops.length === 0 ? (
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
          {strings.home.cropsLoading}
        </Text>
      ) : crops.length === 0 ? (
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, fontSize: 13 }]}>
          {strings.home.cropsEmpty}
        </Text>
      ) : (
        <View style={styles.chipWrap}>
          {crops.map((crop) => (
            <FavouriteCropChip key={crop} crop={crop} />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: homeColors.sandInset,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: homeColors.divider,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    maxWidth: '100%',
  },
  chipEmoji: {
    fontSize: 13,
    lineHeight: 15,
  },
  chipMr: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    color: palette.green900,
    flexShrink: 1,
  },
});
