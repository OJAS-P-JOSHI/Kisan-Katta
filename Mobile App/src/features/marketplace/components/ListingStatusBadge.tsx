import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getStatusLabel } from '../marketplace.strings';
import { mp } from '../marketplace.ui';
import type { ListingStatus, ListingType } from '../marketplace.types';

type ListingStatusBadgeProps = {
  status: ListingStatus;
  listingType?: ListingType;
  compact?: boolean;
};

function paletteFor(status: ListingStatus, listingType?: ListingType) {
  const labour = listingType === 'labour';

  if (status === 'ACTIVE') {
    return labour
      ? { background: mp.labourBg, text: mp.labourTitle, border: 'rgba(47, 95, 122, 0.22)' }
      : { background: mp.produceBg, text: mp.primaryGreen, border: 'rgba(0, 106, 44, 0.18)' };
  }

  if (status === 'SOLD') {
    return labour
      ? { background: mp.labourWash, text: mp.labourTitle, border: 'rgba(47, 95, 122, 0.2)' }
      : { background: mp.productBg, text: '#8A6A1A', border: 'rgba(201, 162, 39, 0.28)' };
  }

  return {
    background: '#EEEBE4',
    text: mp.bodyGrey,
    border: 'rgba(92, 83, 72, 0.14)',
  };
}

function ListingStatusBadgeComponent({
  status,
  listingType,
  compact = true,
}: ListingStatusBadgeProps) {
  const colors = paletteFor(status, listingType);

  return (
    <View
      style={[
        styles.chip,
        compact ? styles.compact : styles.regular,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text
        style={[styles.label, compact ? styles.labelCompact : styles.labelRegular, { color: colors.text }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {getStatusLabel(status, listingType)}
      </Text>
    </View>
  );
}

export const ListingStatusBadge = memo(ListingStatusBadgeComponent);

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    maxWidth: '100%',
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  regular: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontWeight: '700',
  },
  labelCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
  labelRegular: {
    fontSize: 12,
    lineHeight: 16,
  },
});
