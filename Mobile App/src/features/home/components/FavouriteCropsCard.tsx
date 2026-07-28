import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';

import { strings } from '@/constants';
import { translateCropName } from '@/features/market/market.translate';
import { cardSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

type FavouriteCropsCardProps = {
  /** All profile favourite crops — never filtered by market availability. */
  crops: readonly string[];
  loading: boolean;
};

const FavouriteCropChip = memo(function FavouriteCropChip({ crop }: { crop: string }) {
  const label = useMemo(() => translateCropName(crop), [crop]);
  return (
    <Chip compact mode="flat" style={styles.chip} textStyle={styles.chipText}>
      {label}
    </Chip>
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
      <Card.Content>
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
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1, gap: 2, minWidth: 0 },
  divider: { marginVertical: spacing.sm },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
