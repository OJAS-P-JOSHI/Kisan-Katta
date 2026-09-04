import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';

import { spacing } from '@/theme';

import { HELP_REQUEST_SORT_OPTIONS } from '../assistance.constants';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequestSortOption } from '../assistance.types';
import { saath, saathPadX, saathText } from '../assistance.ui';

type AssistanceSortChipsProps = {
  selected: HelpRequestSortOption;
  onSelect: (sort: HelpRequestSortOption) => void;
};

const SORT_LABELS: Record<HelpRequestSortOption, string> = {
  newest: assistanceStrings.feed.sortNewest,
  most_supported: assistanceStrings.feed.sortMostSupported,
};

/** Existing newest / most_supported modes — pill chrome only. */
export function AssistanceSortChips({ selected, onSelect }: AssistanceSortChipsProps) {
  const { width } = useWindowDimensions();
  const padX = saathPadX(width);

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingHorizontal: padX }]}
      >
        {HELP_REQUEST_SORT_OPTIONS.map((sort) => {
          const isSelected = selected === sort;
          return (
            <Pressable
              key={sort}
              onPress={() => onSelect(sort)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={SORT_LABELS[sort]}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  saathText.chip,
                  { color: isSelected ? saath.white : saath.heading },
                ]}
                maxFontSizeMultiplier={1.4}
              >
                {SORT_LABELS[sort]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: saath.primary,
    borderColor: saath.primary,
  },
  chipIdle: {
    backgroundColor: saath.white,
    borderColor: saath.line,
  },
  pressed: {
    opacity: 0.88,
  },
});
