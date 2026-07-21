import { memo, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';

import { getMaharashtraCropLabel } from '@/constants';
import {
  elevation,
  palette,
  radius,
  spacing,
  useAppTheme,
} from '@/theme';

import { MINIMUM_VOTES_REQUIRED } from '../farmer-price.constants';
import { farmerPriceStrings, getConfidenceLabel } from '../farmer-price.strings';
import type { ConfidenceLevel, PollDetailResponseDTO } from '../farmer-price.types';
import {
  formatCompactRemaining,
  formatDiffChip,
  formatRupee,
  remainingProgress,
} from '../farmer-price.utils';

type PollCardProps = {
  poll: PollDetailResponseDTO;
  /** Embedded vote form or submitted state — rendered inside the same card. */
  children?: ReactNode;
  onViewComments?: () => void;
};

const CARD_RADIUS = 18;

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

function MetaChip({
  label,
  backgroundColor,
  color,
}: {
  label: string;
  backgroundColor: string;
  color: string;
}) {
  return (
    <View style={[styles.metaChip, { backgroundColor }]}>
      <Text style={[styles.metaChipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function PollCardComponent({ poll, children, onViewComments }: PollCardProps) {
  const theme = useAppTheme();
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const cropLabel = getMaharashtraCropLabel(poll.crop) || poll.crop;
  const showGovUnavailable = !poll.governmentPriceAvailable;
  const showCommunityUnavailable = !poll.minimumVotesReached;
  const showDiff =
    poll.governmentPriceAvailable &&
    poll.minimumVotesReached &&
    poll.differencePercentage != null;

  const conf = confidenceColors(poll.confidence);
  const progress = remainingProgress(poll.remainingHours);
  const diffPositive = showDiff && (poll.differenceFromGovernmentPrice ?? 0) > 0;
  const diffNegative = showDiff && (poll.differenceFromGovernmentPrice ?? 0) < 0;

  const votesNeeded = Math.max(0, MINIMUM_VOTES_REQUIRED - poll.voteCount);
  const votesChipLabel = poll.minimumVotesReached
    ? farmerPriceStrings.poll.votesChip(poll.voteCount)
    : farmerPriceStrings.poll.votesProgressChip(poll.voteCount, MINIMUM_VOTES_REQUIRED);

  /** Comment count from backend insight/comment payload (anonymous reasons). */
  const commentCount = poll.recentInsights.length;
  const viewCommentsLabel =
    commentCount === 0
      ? farmerPriceStrings.poll.viewCommentsEmpty
      : farmerPriceStrings.poll.viewComments(commentCount);

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({
              inputRange: [0, 1],
              outputRange: [6, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={[styles.card, elevation.soft, { backgroundColor: theme.colors.surface }]}
        accessibilityLabel={farmerPriceStrings.poll.a11yPollCard(cropLabel, poll.district)}
      >
        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <Text style={[styles.cropName, { color: theme.colors.onSurface }]} numberOfLines={1}>
              🌾 {cropLabel}
            </Text>
            <Text style={[styles.district, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              📍 {poll.district}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.poll.governmentPriceLabel}
            </Text>
            {showGovUnavailable ? (
              <View style={[styles.warnChip, { backgroundColor: palette.amber100 }]}>
                <Text style={[styles.warnChipText, { color: palette.amber700 }]} numberOfLines={1}>
                  {farmerPriceStrings.poll.governmentPriceUnavailableChip}
                </Text>
              </View>
            ) : (
              <Text style={[styles.metricValue, { color: theme.colors.onSurface }]}>
                {formatRupee(poll.governmentPriceSnapshot ?? 0)}
              </Text>
            )}
          </View>

          <View style={[styles.metricVRule, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.metricCol}>
            <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.poll.communityPriceLabel}
            </Text>
            {showCommunityUnavailable ? (
              <View style={styles.waitingBlock}>
                <Text style={styles.waitingEmoji}>⏳</Text>
                <Text style={[styles.waitingTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {farmerPriceStrings.poll.waitingVotesProgress(
                    poll.voteCount,
                    MINIMUM_VOTES_REQUIRED,
                  )}
                </Text>
                <Text
                  style={[styles.waitingCaption, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {farmerPriceStrings.poll.waitingVotesNeed(votesNeeded)}
                </Text>
              </View>
            ) : (
              <View style={styles.communityValueRow}>
                <Text style={[styles.communityValue, { color: palette.green900 }]}>
                  {formatRupee(poll.communityExpectedPrice ?? 0)}
                </Text>
                {showDiff ? (
                  <View
                    style={[
                      styles.diffChip,
                      {
                        backgroundColor: diffPositive
                          ? palette.green50
                          : diffNegative
                            ? palette.red100
                            : palette.mist,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.diffChipText,
                        {
                          color: diffPositive
                            ? palette.green900
                            : diffNegative
                              ? palette.red700
                              : palette.steel,
                        },
                      ]}
                    >
                      {formatDiffChip(poll.differencePercentage!)}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.chipsRow}>
          <MetaChip
            label={votesChipLabel}
            backgroundColor={palette.green50}
            color={palette.green900}
          />
          <MetaChip
            label={getConfidenceLabel(poll.confidence)}
            backgroundColor={conf.bg}
            color={conf.fg}
          />
          <MetaChip
            label={farmerPriceStrings.poll.timeChip(formatCompactRemaining(poll.remainingHours))}
            backgroundColor={palette.mist}
            color={palette.slate}
          />
        </View>

        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
        />

        {children ? (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
            <View style={styles.voteArea}>{children}</View>
          </>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        <Pressable
          onPress={onViewComments}
          style={styles.commentsRow}
          accessibilityRole="button"
          accessibilityLabel={farmerPriceStrings.poll.a11yViewComments}
        >
          <Text style={[styles.commentsLabel, { color: theme.colors.primary }]}>
            {viewCommentsLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const PollCard = memo(PollCardComponent);

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    padding: spacing.md,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleLeft: {
    flex: 1,
    gap: 2,
  },
  cropName: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  district: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  metricCol: {
    flex: 1,
    gap: 4,
    minHeight: 56,
  },
  metricVRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: 2,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  metricValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  communityValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  communityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  warnChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  warnChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  waitingBlock: {
    gap: 2,
    marginTop: 2,
  },
  waitingEmoji: {
    fontSize: 14,
    lineHeight: 18,
  },
  waitingTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  waitingCaption: {
    fontSize: 11,
    lineHeight: 15,
  },
  diffChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  diffChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  metaChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  progress: {
    height: 3,
    borderRadius: radius.pill,
  },
  voteArea: {
    gap: 12,
  },
  commentsRow: {
    minHeight: 48,
    justifyContent: 'center',
  },
  commentsLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
