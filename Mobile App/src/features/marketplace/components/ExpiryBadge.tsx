import { StyleSheet, Text, View } from 'react-native';

import { mp } from '../marketplace.ui';
import type { ExpiryTone } from '../marketplace.utils';

type ExpiryBadgeProps = {
  label: string;
  tone: ExpiryTone;
};

const TONE_COLORS: Record<ExpiryTone, { background: string; text: string; border: string }> = {
  neutral: {
    background: mp.produceBg,
    text: mp.bodyGrey,
    border: 'rgba(0, 106, 44, 0.12)',
  },
  warning: {
    background: mp.productBg,
    text: '#8A6A1A',
    border: 'rgba(201, 162, 39, 0.28)',
  },
  strong: {
    background: '#FDEAD7',
    text: '#9A3412',
    border: 'rgba(154, 52, 18, 0.22)',
  },
  critical: {
    background: '#FCE8E8',
    text: '#BA1A1A',
    border: 'rgba(186, 26, 26, 0.22)',
  },
  expired: {
    background: '#EEEBE4',
    text: mp.bodyGrey,
    border: 'rgba(92, 83, 72, 0.14)',
  },
};

/** Compact expiry countdown for My Listings. */
export function ExpiryBadge({ label, tone }: ExpiryBadgeProps) {
  const colors = TONE_COLORS[tone];

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Text
        style={[styles.label, { color: colors.text }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.4}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
});
