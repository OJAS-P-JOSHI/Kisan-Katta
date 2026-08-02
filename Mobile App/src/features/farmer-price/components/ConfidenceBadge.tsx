import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius } from '@/theme';

import { getConfidenceLabel } from '../farmer-price.strings';
import type { ConfidenceLevel } from '../farmer-price.types';

type ConfidenceBadgeProps = {
  confidence: ConfidenceLevel;
  size?: 'sm' | 'md';
};

function confidenceColors(level: ConfidenceLevel): { bg: string; fg: string } {
  switch (level) {
    case 'HIGH':
      return { bg: palette.green100, fg: palette.green900 };
    case 'MEDIUM':
      return { bg: palette.blue100, fg: palette.blue800 };
    case 'LOW':
      return { bg: palette.amber100, fg: palette.orange800 };
    default:
      return { bg: palette.mist, fg: palette.steel };
  }
}

/** Confidence pill shared by the summary card and the detail header. */
export const ConfidenceBadge = memo(function ConfidenceBadge({
  confidence,
  size = 'md',
}: ConfidenceBadgeProps) {
  const { bg, fg } = confidenceColors(confidence);

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: bg },
      ]}
    >
      <Text
        style={[styles.label, size === 'sm' ? styles.labelSm : styles.labelMd, { color: fg }]}
        numberOfLines={1}
      >
        {getConfidenceLabel(confidence)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeMd: { paddingHorizontal: 10, paddingVertical: 5 },
  label: { fontWeight: '700', letterSpacing: 0.4 },
  labelSm: { fontSize: 11, lineHeight: 14 },
  labelMd: { fontSize: 12, lineHeight: 16 },
});
