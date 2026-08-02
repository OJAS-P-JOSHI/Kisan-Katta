import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius } from '@/theme';

import { formatDiffChip } from '../farmer-price.utils';

type PriceDeltaProps = {
  differencePercentage: number;
  size?: 'sm' | 'md';
};

/**
 * Green when the community values the crop above the government rate,
 * warm red when below. Neutral on an exact match.
 */
export function deltaTone(differencePercentage: number): { bg: string; fg: string } {
  if (differencePercentage > 0) return { bg: palette.green50, fg: palette.green900 };
  if (differencePercentage < 0) return { bg: palette.red100, fg: palette.red700 };
  return { bg: palette.mist, fg: palette.steel };
}

export const PriceDelta = memo(function PriceDelta({
  differencePercentage,
  size = 'md',
}: PriceDeltaProps) {
  const tone = deltaTone(differencePercentage);

  return (
    <View
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : styles.chipMd,
        { backgroundColor: tone.bg },
      ]}
    >
      <Text
        style={[styles.text, size === 'sm' ? styles.textSm : styles.textMd, { color: tone.fg }]}
      >
        {formatDiffChip(differencePercentage)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: { borderRadius: radius.sm, alignSelf: 'center' },
  chipSm: { paddingHorizontal: 8, paddingVertical: 2 },
  chipMd: { paddingHorizontal: 10, paddingVertical: 4 },
  text: { fontWeight: '700' },
  textSm: { fontSize: 12, lineHeight: 16 },
  textMd: { fontSize: 14, lineHeight: 18 },
});
