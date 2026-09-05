import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, Text as RNText, View, useWindowDimensions } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { getCropEmoji } from '@/features/market/market.translate';
import { mp, mpCard, mpRadius } from '@/features/marketplace/marketplace.ui';
import { iconSize } from '@/theme';

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
  const { width } = useWindowDimensions();
  const stackPrices = width < 390;
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
  const govValue =
    poll.governmentPriceAvailable && poll.governmentPriceSnapshot !== null
      ? formatRupee(poll.governmentPriceSnapshot)
      : '—';

  return (
    <View
      style={[styles.card, mpCard]}
      accessibilityLabel={farmerPriceStrings.card.a11yCard(cropLabel, poll.district)}
    >
      <View style={styles.headerRow}>
        <View style={styles.cropIconWrap}>
          <RNText style={styles.cropEmoji}>{cropEmoji}</RNText>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.crop} numberOfLines={2}>
            {cropLabel}
          </Text>
          <Text style={styles.meta} numberOfLines={2}>
            {`${poll.district}  ·  ${farmerPriceStrings.card.closingIn(
              formatCompactRemaining(poll.remainingHours),
            )}`}
          </Text>
        </View>
      </View>

      <View style={[styles.priceRow, stackPrices && styles.priceRowStacked]}>
        <View style={[styles.priceTile, styles.govTile, stackPrices && styles.priceTileFull]}>
          <View style={styles.priceLabelRow}>
            <View style={[styles.priceIconWrap, styles.govIconWrap]}>
              <MaterialCommunityIcons name="office-building-outline" size={14} color={mp.labourTitle} />
            </View>
            <Text style={styles.priceLabel} numberOfLines={1}>
              {farmerPriceStrings.card.governmentPriceLabel}
            </Text>
          </View>
          <Text style={styles.priceValue}>{govValue}</Text>
        </View>

        <View
          style={[
            styles.priceTile,
            hasCommunity ? styles.communityTileActive : styles.communityTile,
            stackPrices && styles.priceTileFull,
          ]}
        >
          <View style={styles.priceLabelRow}>
            <View style={[styles.priceIconWrap, styles.communityIconWrap]}>
              <MaterialCommunityIcons name="account-group-outline" size={14} color={mp.primaryGreen} />
            </View>
            <Text style={styles.priceLabel} numberOfLines={1}>
              {farmerPriceStrings.card.communityPriceLabel}
            </Text>
          </View>
          {hasCommunity ? (
            <View style={styles.communityValueRow}>
              <Text style={[styles.priceValue, styles.communityValue]}>
                {formatRupee(poll.communityExpectedPrice!)}
              </Text>
              {showDelta ? (
                <PriceDelta differencePercentage={poll.differencePercentage!} size="sm" />
              ) : null}
            </View>
          ) : (
            <Text style={styles.priceValueMuted}>
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

      <View style={[styles.statusPill, state === 'voted' ? styles.statusVoted : styles.statusDefault]}>
        <Text
          style={[styles.statusText, state === 'voted' ? styles.statusVotedText : styles.statusDefaultText]}
          numberOfLines={2}
        >
          {status}
        </Text>
      </View>

      {hasCommunity || topSignals.length > 0 ? (
        <View style={styles.secondaryRow}>
          {hasCommunity ? (
            <View style={styles.confidenceWrap}>
              <Text style={styles.secondaryLabel}>{farmerPriceStrings.card.confidenceLabel}</Text>
              <ConfidenceBadge confidence={poll.confidence} size="sm" />
            </View>
          ) : null}
          {topSignals.length > 0 ? (
            <View style={styles.signalChips}>
              {topSignals.map((signal) => (
                <View key={signal.reasonType} style={styles.signalChip}>
                  <Text style={styles.signalChipText} numberOfLines={1}>
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
        buttonColor={state === 'invite' ? mp.primaryGreen : undefined}
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cropIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mp.produceWash,
    flexShrink: 0,
  },
  cropEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  crop: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: mp.headingGreen,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    color: mp.muted,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceRowStacked: {
    flexDirection: 'column',
  },
  priceTile: {
    flex: 1,
    minWidth: 0,
    borderRadius: mpRadius.tile,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  priceTileFull: {
    flex: 0,
    width: '100%',
  },
  govTile: {
    backgroundColor: mp.labourBg,
  },
  communityTile: {
    backgroundColor: mp.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.cardLine,
  },
  communityTileActive: {
    backgroundColor: mp.produceBg,
  },
  priceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  priceIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  govIconWrap: {
    backgroundColor: mp.labourWash,
  },
  communityIconWrap: {
    backgroundColor: mp.produceWash,
  },
  priceLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.15,
    color: mp.muted,
  },
  priceValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: mp.headingGreen,
  },
  communityValue: {
    color: mp.headingGreen,
  },
  priceValueMuted: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: mp.bodyGrey,
  },
  communityValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusPill: {
    borderRadius: mpRadius.tile,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusDefault: {
    backgroundColor: mp.produceBg,
  },
  statusVoted: {
    backgroundColor: mp.labourBg,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  statusDefaultText: {
    color: mp.headingGreen,
  },
  statusVotedText: {
    color: mp.labourTitle,
  },
  secondaryRow: {
    gap: 8,
  },
  confidenceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: mp.muted,
  },
  signalChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  signalChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: mpRadius.chip,
    backgroundColor: mp.cream,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: mp.cardLine,
  },
  signalChipText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: mp.bodyGrey,
  },
  action: {
    borderRadius: mpRadius.chip,
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
