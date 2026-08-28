import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getCropDisplayParts, getCropEmoji } from '@/features/market/market.translate';
import { palette, radius, spacing, typography, useAppTheme } from '@/theme';

import { homeSurfaces, homeText } from '../home.theme';

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
      <View style={styles.chipTextBlock}>
        <Text style={styles.chipMr} numberOfLines={2}>
          {parts.marathi}
        </Text>
        <Text style={styles.chipEn} numberOfLines={1}>
          {parts.english}
        </Text>
      </View>
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
      <View style={styles.header}>
        <Text style={[homeText.sectionUtility, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {strings.home.cropsTitle}
        </Text>
        <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {loading ? strings.home.cropsLoading : subtitle}
        </Text>
      </View>

      {loading && crops.length === 0 ? (
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
          {strings.home.cropsLoading}
        </Text>
      ) : crops.length === 0 ? (
        <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
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
    gap: spacing.md,
  },
  header: {
    gap: 4,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.sand,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.mist,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    maxWidth: '100%',
  },
  chipEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  chipTextBlock: {
    flexShrink: 1,
    gap: 1,
    minWidth: 0,
  },
  chipMr: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: palette.green900,
  },
  chipEn: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: palette.steel,
  },
});
