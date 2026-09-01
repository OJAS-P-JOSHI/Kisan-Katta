import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  CATEGORY_FILTER_ALL,
  MARKETPLACE_CATEGORIES,
  type CategoryFilter,
} from '../marketplace.constants';
import { getCategoryLabel, marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type CategoryChipsProps = {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
  /** Override chip list (e.g. labour categories). Defaults to all marketplace categories. */
  categories?: readonly string[];
};

export function CategoryChips({
  selected,
  onSelect,
  categories: categoriesProp,
}: CategoryChipsProps) {
  const categories: CategoryFilter[] = [
    CATEGORY_FILTER_ALL,
    ...((categoriesProp ?? MARKETPLACE_CATEGORIES) as CategoryFilter[]),
  ];

  const renderChip = useCallback(
    (category: CategoryFilter) => {
      const label =
        category === CATEGORY_FILTER_ALL
          ? marketplaceStrings.listings.categoryAll
          : getCategoryLabel(category);
      const active = selected === category;

      return (
        <Pressable
          key={category}
          onPress={() => onSelect(category)}
          style={({ pressed }) => [
            styles.chip,
            active ? styles.chipActive : styles.chipIdle,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          accessibilityLabel={label}
        >
          <Text
            style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
          >
            {label}
          </Text>
        </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  chipIdle: {
    backgroundColor: mp.white,
    borderColor: mp.searchBorder,
  },
  chipActive: {
    backgroundColor: mp.produceBg,
    borderColor: 'rgba(0, 106, 44, 0.22)',
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  chipLabelIdle: {
    color: mp.tagline,
  },
  chipLabelActive: {
    color: mp.primaryGreen,
  },
  pressed: {
    opacity: 0.85,
  },
});
