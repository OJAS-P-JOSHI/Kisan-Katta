import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { getCropEmoji } from '@/features/market/market.translate';
import { cardSurface, iconSize, palette, radius, spacing, useAppTheme } from '@/theme';

import { HOME_SIGNALS_LIMIT, MINIMUM_VOTES_REQUIRED } from '../farmer-price.constants';
import {
  farmerPriceStrings,
  getReasonEmoji,
  getReasonTypeLabel,
} from '../farmer-price.strings';
import type { PollDetailResponseDTO } from '../farmer-price.types';
import { formatCompactRemaining, formatRupee } from '../farmer-price.utils';
import { ConfidenceBadge } from './ConfidenceBadge';
import { PriceDelta } from './PriceDelta';

export type PollCardFocus = 'vote' | 'community';

type PollCardProps = {
  poll: PollDetailResponseDTO;
  cropLabel: string;
  hasVoted: boolean;
  onOpen: (pollId: string, focus: PollCardFocus) => void;
};

type CardState = 'invite' | 'voted' | 'consensus';

function resolveCardState(hasVoted: boolean, minimumVotesReached: boolean): CardState {
  if (!hasVoted) return 'invite';
  if (minimumVotesReached) return 'consensus';
  return 'voted';
}

/**
 * Light, scannable summary card — hierarchy: crop → prices → status → CTA.
 * Behaviour and navigation are unchanged.
 */
function PollCardComponent({ poll, cropLabel, hasVoted, onOpen }: PollCardProps) {
  const theme = useAppTheme();
  const state = resolveCardState(hasVoted, poll.minimumVotesReached);
  const cropEmoji = useMemo(() => getCropEmoji(poll.crop), [poll.crop]);

  const hasCommunity =
    poll.minimumVotesReached && poll.communityExpectedPrice !== null;
  const showDelta =
    hasCommunity &&
    poll.governmentPriceAvailable &&
    poll.differencePercentage != null;

  const ctaLabel =
    state === 'invite'
      ? poll.voteCount === 0
        ? farmerPriceStrings.card.shareOpinion
        : farmerPriceStrings.card.continueVoting
      : hasCommunity
        ? farmerPriceStrings.card.viewCommunity
        : farmerPriceStrings.card.viewDetails;

  const ctaIcon =
    state === 'invite' ? ('pencil-outline' as const) : ('eye-outline' as const);

  const ctaFocus: PollCardFocus = state === 'invite' ? 'vote' : 'community';
  const ctaA11y =
    state === 'invite'
      ? farmerPriceStrings.card.a11yShare(cropLabel)
      : farmerPriceStrings.card.a11yViewCommunity(cropLabel);

  const status = resolveStatusCopy(state, poll.voteCount, poll.district);
  const topSignals = poll.marketSignals.slice(0, HOME_SIGNALS_LIMIT);

  return (
    <View
      style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
      accessibilityLabel={farmerPriceStrings.card.a11yCard(cropLabel, poll.district)}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <RNText style={styles.cropEmoji}>{cropEmoji}</RNText>
        <View style={styles.headerText}>
          <Text style={[styles.crop, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {cropLabel}
          </Text>
          <Text
            style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {`${poll.district}  ·  ${farmerPriceStrings.card.closingIn(
              formatCompactRemaining(poll.remainingHours),
            )}`}
          </Text>
        </View>
      </View>

      {/* Price tiles */}
      <View style={styles.priceRow}>
        <View
          style={[
            styles.priceTile,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
            {`🏛️  ${farmerPriceStrings.card.governmentPriceLabel}`}
          </Text>
          <Text style={[styles.priceValue, { color: theme.colors.onSurface }]}>
            {poll.governmentPriceAvailable && poll.governmentPriceSnapshot !== null
              ? formatRupee(poll.governmentPriceSnapshot)
              : '—'}
          </Text>
        </View>

        <View
          style={[
            styles.priceTile,
            {
              backgroundColor: hasCommunity ? palette.green50 : theme.colors.surfaceVariant,
              borderColor: hasCommunity ? palette.green100 : theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
            {`👨‍🌾  ${farmerPriceStrings.card.communityPriceLabel}`}
          </Text>
          {hasCommunity ? (
            <View style={styles.communityValueRow}>
              <Text style={[styles.priceValue, { color: palette.green900 }]}>
                {formatRupee(poll.communityExpectedPrice!)}
              </Text>
              {showDelta ? (
                <PriceDelta differencePercentage={poll.differencePercentage!} size="sm" />
              ) : null}
            </View>
          ) : (
            <Text style={[styles.priceValueMuted, { color: theme.colors.onSurfaceVariant }]}>
              {poll.voteCount > 0
                ? farmerPriceStrings.card.communityProgressShort(
                    poll.voteCount,
                    MINIMUM_VOTES_REQUIRED,
                  )
                : '—'}
            </Text>
          )}
        </View>
      </View>

      {/* Single status line */}
      <View
        style={[
          styles.statusPill,
          {
            backgroundColor: state === 'voted' ? palette.blue100 : palette.green50,
          },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: state === 'voted' ? palette.blue800 : palette.green900 },
          ]}
          numberOfLines={2}
        >
          {status}
        </Text>
      </View>

      {/* Secondary: confidence + top signals only when useful */}
      {hasCommunity || topSignals.length > 0 ? (
        <View style={styles.secondaryRow}>
          {hasCommunity ? (
            <View style={styles.confidenceWrap}>
              <Text style={[styles.secondaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                {`🎯  ${farmerPriceStrings.card.confidenceLabel}`}
              </Text>
              <ConfidenceBadge confidence={poll.confidence} size="sm" />
            </View>
          ) : null}
          {topSignals.length > 0 ? (
            <View style={styles.signalChips}>
              {topSignals.map((signal) => (
                <View
                  key={signal.reasonType}
                  style={[
                    styles.signalChip,
                    { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[styles.signalChipText, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={1}
                  >
                    {`${getReasonEmoji(signal.reasonType)} ${getReasonTypeLabel(signal.reasonType)}`}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Button
        mode={state === 'invite' ? 'contained' : 'contained-tonal'}
        onPress={() => onOpen(poll.id, ctaFocus)}
        style={styles.action}
        contentStyle={styles.actionContent}
        labelStyle={styles.actionLabel}
        buttonColor={state === 'invite' ? palette.green700 : undefined}
        icon={({ size, color }) => (
          <MaterialCommunityIcons name={ctaIcon} size={size ?? iconSize.sm} color={color} />
        )}
        accessibilityLabel={ctaA11y}
      >
        {ctaLabel}
      </Button>
    </View>
  );
}

function resolveStatusCopy(state: CardState, voteCount: number, district: string): string {
  if (state === 'invite') {
    return voteCount === 0
      ? farmerPriceStrings.card.statusEmpty(district)
      : farmerPriceStrings.card.statusPartial(voteCount, MINIMUM_VOTES_REQUIRED);
  }
  if (state === 'voted') {
    return farmerPriceStrings.card.statusVoted;
  }
  return farmerPriceStrings.card.statusConsensus;
}

export const PollCard = memo(PollCardComponent);

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cropEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  crop: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceTile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  priceValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  priceValueMuted: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  communityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  secondaryRow: {
    gap: 8,
  },
  confidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  signalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signalChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  signalChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  action: {
    borderRadius: radius.xl,
  },
  actionContent: {
    height: 44,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
