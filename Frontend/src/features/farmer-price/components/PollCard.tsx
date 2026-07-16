import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text } from 'react-native-paper';

import { getMaharashtraCropLabel } from '@/constants';
import {
  cardSurface,
  iconSize,
  palette,
  radius,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { farmerPriceStrings, getConfidenceLabel } from '../farmer-price.strings';
import type { PollDetailResponseDTO } from '../farmer-price.types';
import {
  formatDifference,
  formatPercentage,
  formatRemainingTime,
  formatRupee,
  formatShortDate,
  remainingProgress,
} from '../farmer-price.utils';

type PollCardProps = {
  poll: PollDetailResponseDTO;
};

function ConfidenceChip({ confidence }: { confidence: PollDetailResponseDTO['confidence'] }) {
  const theme = useAppTheme();
  const isUnavailable = confidence === 'NOT_AVAILABLE';
  const bg = isUnavailable ? theme.colors.surfaceVariant : theme.colors.primaryContainer;
  const fg = isUnavailable ? theme.colors.onSurfaceVariant : theme.colors.onPrimaryContainer;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[typography.caption, { color: fg, fontWeight: '700' }]}>
        {getConfidenceLabel(confidence)}
      </Text>
    </View>
  );
}

function PollCardComponent({ poll }: PollCardProps) {
  const theme = useAppTheme();
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [appear]);

  const cropLabel = getMaharashtraCropLabel(poll.crop) || poll.crop;
  const showGovUnavailable = !poll.governmentPriceAvailable;
  const showCommunityUnavailable = !poll.minimumVotesReached;
  const showDiff =
    poll.governmentPriceAvailable &&
    poll.minimumVotesReached &&
    poll.differenceFromGovernmentPrice != null &&
    poll.differencePercentage != null;

  let diffColor = theme.colors.onSurfaceVariant;
  if (showDiff && poll.differenceFromGovernmentPrice != null) {
    if (poll.differenceFromGovernmentPrice > 0) diffColor = palette.green700;
    else if (poll.differenceFromGovernmentPrice < 0) diffColor = palette.red700;
  }

  const progress = remainingProgress(poll.remainingHours);

  return (
    <Animated.View style={{ opacity: appear, transform: [{ translateY: appear.interpolate({
      inputRange: [0, 1],
      outputRange: [8, 0],
    }) }] }}>
      <Card
        mode="elevated"
        style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
        accessibilityLabel={farmerPriceStrings.poll.a11yPollCard(cropLabel, poll.district)}
      >
        <Card.Content style={styles.content}>
          <View>
            <Text style={[typography.largeHeading, styles.cropName, { color: theme.colors.onSurface }]}>
              {cropLabel}
            </Text>
            <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
              {poll.district}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

          <View style={styles.section}>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.poll.governmentPriceLabel}
            </Text>
            {showGovUnavailable ? (
              <Text style={[typography.body, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
                {farmerPriceStrings.poll.governmentPriceUnavailable}
              </Text>
            ) : (
              <>
                <Text style={[styles.priceValue, { color: theme.colors.onSurface }]}>
                  {formatRupee(poll.governmentPriceSnapshot ?? 0)}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {farmerPriceStrings.poll.perQuintal}
                </Text>
                {poll.governmentPriceDate ? (
                  <Text style={[typography.caption, styles.updated, { color: theme.colors.onSurfaceVariant }]}>
                    {farmerPriceStrings.poll.updated} {formatShortDate(poll.governmentPriceDate)}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.poll.communityPriceLabel}
            </Text>
            {showCommunityUnavailable ? (
              <View style={styles.communityUnavailable}>
                <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, fontSize: 18 }]}>
                  {farmerPriceStrings.poll.minimumVotesNotReached}
                </Text>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {farmerPriceStrings.poll.minimumVotesCaption}
                </Text>
              </View>
            ) : (
              <View style={styles.communityRow}>
                <Text style={[styles.communityPrice, { color: palette.green700 }]}>
                  {formatRupee(poll.communityExpectedPrice ?? 0)}
                </Text>
                <ConfidenceChip confidence={poll.confidence} />
              </View>
            )}
            <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }]}>
              {farmerPriceStrings.poll.voteCount(poll.voteCount)}
            </Text>
            {showDiff ? (
              <Text style={[typography.body, styles.diff, { color: diffColor, fontWeight: '600' }]}>
                {formatDifference(poll.differenceFromGovernmentPrice!)}{' '}
                {formatPercentage(poll.differencePercentage!)}
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.endsRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={iconSize.md}
                color={theme.colors.onSurfaceVariant}
              />
              <View style={styles.endsText}>
                <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                  {farmerPriceStrings.poll.votingEnds}
                </Text>
                <Text style={[typography.body, { color: theme.colors.onSurface, fontWeight: '600' }]}>
                  {formatRemainingTime(poll.remainingHours)}
                </Text>
              </View>
            </View>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
            />
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
}

export const PollCard = memo(PollCardComponent);

const styles = StyleSheet.create({
  card: {},
  content: {
    padding: spacing.md + 4,
    gap: spacing.md,
  },
  cropName: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  section: {
    gap: 2,
  },
  priceValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  updated: {
    marginTop: spacing.xs,
  },
  communityUnavailable: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  communityPrice: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  diff: {
    marginTop: spacing.xs,
  },
  endsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  endsText: {
    flex: 1,
    gap: 2,
  },
  progress: {
    marginTop: spacing.sm,
    height: 6,
    borderRadius: radius.pill,
  },
});
