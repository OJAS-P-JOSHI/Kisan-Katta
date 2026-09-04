import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';

import { iconSize, spacing } from '@/theme';

import { assistanceStrings } from '../assistance.strings';
import type { MyAssistanceSummary } from '../assistance.types';
import { saath, saathCard, saathText } from '../assistance.ui';

type MyAssistanceSummaryCardProps = {
  summary: MyAssistanceSummary;
  onCreatePress: () => void;
  createDisabled: boolean;
};

/** Status counts plus the active-request quota shown above "My requests". */
export function MyAssistanceSummaryCard({
  summary,
  onCreatePress,
  createDisabled,
}: MyAssistanceSummaryCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 360;
  const numberSize = compact ? 22 : 26;

  const metrics = [
    {
      key: 'pending',
      label: assistanceStrings.myRequests.summaryPending,
      value: summary.pendingReview,
      wash: saath.amberWash,
      tint: saath.amber,
    },
    {
      key: 'open',
      label: assistanceStrings.myRequests.summaryOpen,
      value: summary.open,
      wash: saath.wash,
      tint: saath.primary,
    },
    {
      key: 'resolved',
      label: assistanceStrings.myRequests.summaryResolved,
      value: summary.resolved,
      wash: saath.mist,
      tint: saath.muted,
    },
  ] as const;

  return (
    <View style={saathCard}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text
            style={[saathText.cardTitle, styles.title, { color: saath.heading }]}
            maxFontSizeMultiplier={1.3}
          >
            {assistanceStrings.myRequests.summaryTitle}
          </Text>
          <View style={styles.quotaPill}>
            <Text
              style={[saathText.chip, { color: saath.primary }]}
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
            >
              {assistanceStrings.myRequests.activeCount(summary.activeCount, summary.maxActive)}
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          {metrics.map((metric) => (
            <View key={metric.key} style={[styles.metric, { backgroundColor: metric.wash }]}>
              <Text
                style={[
                  styles.metricValue,
                  { color: metric.tint, fontSize: numberSize, lineHeight: numberSize + 4 },
                ]}
                maxFontSizeMultiplier={1.2}
              >
                {metric.value}
              </Text>
              <Text
                numberOfLines={1}
                style={[saathText.meta, { color: saath.body, fontWeight: '600' }]}
                maxFontSizeMultiplier={1.2}
              >
                {metric.label}
              </Text>
            </View>
          ))}
        </View>

        {!summary.canCreate ? (
          <Text style={[saathText.meta, { color: saath.error }]} maxFontSizeMultiplier={1.3}>
            {assistanceStrings.create.limitReachedMessage}
          </Text>
        ) : null}

        <Pressable
          onPress={onCreatePress}
          disabled={createDisabled}
          accessibilityRole="button"
          accessibilityLabel={assistanceStrings.feed.createRequest}
          accessibilityState={{ disabled: createDisabled }}
          style={({ pressed }) => [
            styles.cta,
            createDisabled && styles.ctaDisabled,
            pressed && !createDisabled && styles.ctaPressed,
          ]}
        >
          <MaterialCommunityIcons
            name="hand-heart-outline"
            size={iconSize.md}
            color={createDisabled ? saath.muted : saath.white}
          />
          <Text
            style={[
              saathText.supportAction,
              styles.ctaLabel,
              { color: createDisabled ? saath.muted : saath.white },
            ]}
            maxFontSizeMultiplier={1.2}
          >
            {assistanceStrings.feed.createRequest}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
  },
  quotaPill: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    backgroundColor: saath.wash,
    borderWidth: 1,
    borderColor: saath.line,
    flexShrink: 0,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: saath.primary,
  },
  ctaDisabled: {
    backgroundColor: saath.disabled,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    fontSize: 16,
    lineHeight: 22,
  },
});
