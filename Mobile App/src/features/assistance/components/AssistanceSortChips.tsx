import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { spacing } from '@/theme';

import { HELP_REQUEST_SORT_OPTIONS } from '../assistance.constants';
import { assistanceStrings } from '../assistance.strings';
import type { HelpRequestSortOption } from '../assistance.types';

type AssistanceSortChipsProps = {
  selected: HelpRequestSortOption;
  onSelect: (sort: HelpRequestSortOption) => void;
};

const SORT_LABELS: Record<HelpRequestSortOption, string> = {
  newest: assistanceStrings.feed.sortNewest,
  most_supported: assistanceStrings.feed.sortMostSupported,
};

/** Horizontal sort chips — same pattern as Marketplace CategoryChips. */
export function AssistanceSortChips({ selected, onSelect }: AssistanceSortChipsProps) {
  const renderChip = useCallback(
    (sort: HelpRequestSortOption) => (
      <Chip
        key={sort}
        compact
        selected={selected === sort}
        onPress={() => onSelect(sort)}
        style={styles.chip}
      >
        {SORT_LABELS[sort]}
      </Chip>
    ),
    [onSelect, selected],
  );

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {HELP_REQUEST_SORT_OPTIONS.map(renderChip)}
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

