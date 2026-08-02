import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { cardSurface, radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import type { MyAssistanceSummary } from '../assistance.types';

type MyAssistanceSummaryCardProps = {
  summary: MyAssistanceSummary;
};

/** Status counts plus the active-request quota shown above "My requests". */
export function MyAssistanceSummaryCard({ summary }: MyAssistanceSummaryCardProps) {
  const theme = useAppTheme();

  const metrics = [
    { label: assistanceStrings.myRequests.summaryPending, value: summary.pendingReview },
    { label: assistanceStrings.myRequests.summaryOpen, value: summary.open },
    { label: assistanceStrings.myRequests.summaryResolved, value: summary.resolved },
  ];

  return (
    <Card style={[cardSurface, { backgroundColor: theme.colors.surface }]} mode="elevated">
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
            {assistanceStrings.myRequests.summaryTitle}
          </Text>
          <View
            style={[styles.quotaPill, { backgroundColor: theme.colors.secondaryContainer }]}
          >
            <Text
              style={[typography.caption, { color: theme.colors.onSecondaryContainer }]}
            >
              {assistanceStrings.myRequests.activeCount(summary.activeCount, summary.maxActive)}
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <View
              key={metric.label}
              style={[styles.metric, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text style={[typography.sectionTitle, { color: theme.colors.onSurface }]}>
                {metric.value}
              </Text>
              <Text
                numberOfLines={1}
                style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}
              >
                {metric.label}
              </Text>
            </View>
          ))}
        </View>

        {!summary.canCreate ? (
          <Text style={[typography.caption, { color: theme.colors.error }]}>
            {assistanceStrings.create.limitReachedMessage}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quotaPill: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
});
