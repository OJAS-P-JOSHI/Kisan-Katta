import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { RECENT_INSIGHTS_LIMIT } from '../farmer-price.constants';
import { farmerPriceStrings, getReasonEmoji, getReasonTypeLabel } from '../farmer-price.strings';
import type { RecentInsightDTO } from '../farmer-price.types';
import { formatRelativeTime } from '../farmer-price.utils';

type CommunityInsightsProps = {
  insights: RecentInsightDTO[];
};

/** Latest anonymous farmer notes — at most five, newest first. */
export const CommunityInsights = memo(function CommunityInsights({
  insights,
}: CommunityInsightsProps) {
  const theme = useAppTheme();
  const visible = insights.slice(0, RECENT_INSIGHTS_LIMIT);

  if (visible.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
          {farmerPriceStrings.detail.insightsEmptyTitle}
        </Text>
        <Text style={[styles.emptyBody, { color: theme.colors.onSurfaceVariant }]}>
          {farmerPriceStrings.detail.insightsEmptyBody}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {visible.map((insight, index) => (
        <View
          key={`${insight.createdAt}-${insight.reasonType}-${index}`}
          style={[styles.item, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Text style={[styles.quote, { color: theme.colors.onSurface }]}>
            {`“${insight.reasonText}”`}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              {`${getReasonEmoji(insight.reasonType)} ${getReasonTypeLabel(insight.reasonType)} · ${insight.author}`}
            </Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
              {formatRelativeTime(insight.createdAt)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  item: {
    borderRadius: radius.lg,
    padding: 14,
    gap: 8,
  },
  quote: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
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
});
