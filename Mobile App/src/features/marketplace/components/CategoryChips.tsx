import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { spacing } from '@/theme';

import {
  CATEGORY_FILTER_ALL,
  MARKETPLACE_CATEGORIES,
  type CategoryFilter,
} from '../marketplace.constants';
import { getCategoryLabel, marketplaceStrings } from '../marketplace.strings';

type CategoryChipsProps = {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
};

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const categories: CategoryFilter[] = [CATEGORY_FILTER_ALL, ...MARKETPLACE_CATEGORIES];

  const renderChip = useCallback(
    (category: CategoryFilter) => {
      const label =
        category === CATEGORY_FILTER_ALL
          ? marketplaceStrings.listings.categoryAll
          : getCategoryLabel(category);

      return (
        <Chip
          key={category}
          compact
          selected={selected === category}
          onPress={() => onSelect(category)}
          style={styles.chip}
        >
          {label}
        </Chip>
      );
    },
    [onSelect, selected],
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {categories.map(renderChip)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: { marginRight: 0 },
});
