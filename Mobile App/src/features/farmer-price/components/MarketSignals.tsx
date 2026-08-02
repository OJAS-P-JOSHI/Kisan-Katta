import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { palette, radius, spacing, useAppTheme } from '@/theme';

import { HOME_SIGNALS_LIMIT } from '../farmer-price.constants';
import {
  farmerPriceStrings,
  getReasonEmoji,
  getReasonTypeLabel,
} from '../farmer-price.strings';
import type { MarketSignalDTO } from '../farmer-price.types';

type MarketSignalsProps = {
  signals: MarketSignalDTO[];
  /** `compact` is the summary card; `full` shows counts and strength bars. */
  variant?: 'compact' | 'full';
};

/**
 * Aggregated reasons behind the community price.
 * Empty states invite the farmer to explain the market — never a dead end.
 */
export const MarketSignals = memo(function MarketSignals({
  signals,
  variant = 'full',
}: MarketSignalsProps) {
  const theme = useAppTheme();
  const isCompact = variant === 'compact';

  const visible = useMemo(
    () => (isCompact ? signals.slice(0, HOME_SIGNALS_LIMIT) : signals),
    [isCompact, signals],
  );

  const strongest = visible[0]?.farmerCount ?? 0;

  if (visible.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {isCompact
            ? farmerPriceStrings.card.signalsEmptyTitle
            : farmerPriceStrings.detail.signalsEmptyTitle}
        </Text>
        <Text style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}>
          {isCompact
            ? farmerPriceStrings.card.signalsEmptyBody
            : farmerPriceStrings.detail.signalsEmptyBody}
        </Text>
      </View>
    );
  }

  if (isCompact) {
    return (
      <View style={styles.compactWrap}>
        {visible.map((signal) => (
          <View
            key={signal.reasonType}
            style={[styles.compactChip, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text style={[styles.compactText, { color: theme.colors.onSurfaceVariant }]}>
              {`${getReasonEmoji(signal.reasonType)}  ${getReasonTypeLabel(signal.reasonType)}`}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.fullWrap}>
      {visible.map((signal) => {
        const ratio = strongest > 0 ? signal.farmerCount / strongest : 0;
        return (
          <View
            key={signal.reasonType}
            style={styles.row}
            accessibilityRole="text"
            accessibilityLabel={`${getReasonTypeLabel(signal.reasonType)}, ${farmerPriceStrings.detail.signalFarmers(signal.farmerCount)}`}
          >
            <View style={styles.rowTop}>
              <Text style={[styles.rowLabel, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {`${getReasonEmoji(signal.reasonType)}  ${getReasonTypeLabel(signal.reasonType)}`}
              </Text>
              <Text style={[styles.rowCount, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.detail.signalFarmers(signal.farmerCount)}
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(6, Math.round(ratio * 100))}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  emptyWrap: { gap: 4 },
  emptyTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  compactWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compactChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  compactText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  fullWrap: {
    gap: 14,
  },
  row: {
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  rowCount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.green500,
  },
});
