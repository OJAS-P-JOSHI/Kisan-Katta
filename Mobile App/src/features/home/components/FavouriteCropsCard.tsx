import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { getCropDisplayParts, getCropEmoji } from '@/features/market/market.translate';
import { cardSurface, iconSize, palette, radius, spacing, typography, useAppTheme } from '@/theme';

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
        <Text style={styles.chipEn} numberOfLines={2}>
          {parts.english}
        </Text>
      </View>
    </View>
  );
});

/**
 * Home Favourite Crops card — profile preferences only.
 * Always renders every favourite crop; ignores market price availability.
 */
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
    <Card mode="elevated" style={[styles.card, cardSurface]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="leaf" size={iconSize.md} color={theme.colors.primary} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {strings.home.cropsTitle}
            </Text>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {loading ? strings.home.cropsLoading : subtitle}
            </Text>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

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
    gap: spacing.xs,
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.green50,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.green100,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    maxWidth: '100%',
  },
  chipEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  chipTextBlock: {
    flexShrink: 1,
    gap: 1,
    minWidth: 0,
  },
  chipMr: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.green900,
  },
  chipEn: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: palette.steel,
  },
});
