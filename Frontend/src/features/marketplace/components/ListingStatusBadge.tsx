import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { spacing, useAppTheme } from '@/theme';

import type { ListingStatus } from '../marketplace.types';
import { getStatusBadgeColors } from '../marketplace.utils';

type ListingStatusBadgeProps = {
  status: ListingStatus;
  compact?: boolean;
};

function ListingStatusBadgeComponent({ status, compact = true }: ListingStatusBadgeProps) {
  const theme = useAppTheme();
  const colors = getStatusBadgeColors(status, theme);

  return (
    <Chip
      compact={compact}
      style={[styles.chip, { backgroundColor: colors.background }]}
      textStyle={[styles.chipText, { color: colors.text }]}
    >
      {status}
    </Chip>
  );
}

export const ListingStatusBadge = memo(ListingStatusBadgeComponent);

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
  chipText: { fontSize: 11, lineHeight: 14, marginVertical: 0 },
});
