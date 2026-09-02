import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';
import type { ListingType } from '../marketplace.types';

export type ListingTypeFilter = 'all' | ListingType;

type ListingTypeChipsProps = {
  selected: ListingTypeFilter;
  onSelect: (value: ListingTypeFilter) => void;
};

const TYPE_CHIPS: { id: ListingTypeFilter; label: string }[] = [
  { id: 'all', label: marketplaceStrings.listings.typeAll },
  { id: 'produce', label: marketplaceStrings.listings.typeProduce },
  { id: 'product', label: marketplaceStrings.listings.typeProduct },
  { id: 'labour', label: marketplaceStrings.listings.typeLabour },
];

/** Compact type chips for hub-wide search results. */
export function ListingTypeChips({ selected, onSelect }: ListingTypeChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {TYPE_CHIPS.map((chip) => {
        const active = selected === chip.id;
        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : styles.chipIdle,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={chip.label}
          >
            <Text
              style={[styles.label, active ? styles.labelActive : styles.labelIdle]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  labelIdle: {
    color: mp.tagline,
  },
  labelActive: {
    color: mp.primaryGreen,
  },
  pressed: {
    opacity: 0.85,
  },
});
