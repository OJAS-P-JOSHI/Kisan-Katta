import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { cardSurface, palette, radius, spacing, useAppTheme } from '@/theme';

import { MINIMUM_VOTES_REQUIRED } from '../farmer-price.constants';
import { farmerPriceStrings } from '../farmer-price.strings';
import type { PollDetailResponseDTO } from '../farmer-price.types';
import { formatCompactRemaining, formatRupee } from '../farmer-price.utils';
import { ConfidenceBadge } from './ConfidenceBadge';
import { MarketSignals } from './MarketSignals';
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

type BannerTone = 'green' | 'blue';

function resolveBanner(
  state: CardState,
  voteCount: number,
): { text: string; tone: BannerTone } {
  if (state === 'invite') {
    return {
      tone: 'green',
      text:
        voteCount === 0
          ? farmerPriceStrings.card.bannerFirst
          : farmerPriceStrings.card.bannerHelp,
    };
  }
  if (state === 'voted') {
    return { tone: 'blue', text: farmerPriceStrings.card.bannerVoted };
  }
  return { tone: 'green', text: farmerPriceStrings.card.bannerConsensus };
}

/**
 * Participation-first summary card.
 * Primary CTA is Share My Opinion until the farmer has voted.
 */
function PollCardComponent({ poll, cropLabel, hasVoted, onOpen }: PollCardProps) {
  const theme = useAppTheme();
  const state = resolveCardState(hasVoted, poll.minimumVotesReached);
  const banner = resolveBanner(state, poll.voteCount);
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

  const ctaFocus: PollCardFocus = state === 'invite' ? 'vote' : 'community';
  const ctaA11y =
    state === 'invite'
      ? farmerPriceStrings.card.a11yShare(cropLabel)
      : farmerPriceStrings.card.a11yViewCommunity(cropLabel);

  const bannerBg = banner.tone === 'blue' ? palette.blue100 : palette.green50;
  const bannerFg = banner.tone === 'blue' ? palette.blue800 : palette.green900;

  return (
    <View
      style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
      accessibilityLabel={farmerPriceStrings.card.a11yCard(cropLabel, poll.district)}
    >
      <View style={[styles.banner, { backgroundColor: bannerBg }]}>
        <Text style={[styles.bannerText, { color: bannerFg }]}>{banner.text}</Text>
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={[styles.crop, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {cropLabel}
          </Text>
          <Text
            style={[styles.district, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {`📍 ${poll.district}  ·  ${farmerPriceStrings.card.closingIn(
              formatCompactRemaining(poll.remainingHours),
            )}`}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceCol}>
          <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.card.governmentPriceLabel}
          </Text>
          <Text style={[styles.priceValueMuted, { color: theme.colors.onSurface }]}>
            {poll.governmentPriceAvailable && poll.governmentPriceSnapshot !== null
              ? formatRupee(poll.governmentPriceSnapshot)
              : '—'}
          </Text>
          <Text style={[styles.priceCaption, { color: theme.colors.onSurfaceVariant }]}>
            {poll.governmentPriceAvailable
              ? farmerPriceStrings.card.governmentPriceCaption
              : farmerPriceStrings.card.governmentPriceUnavailable}
          </Text>
        </View>

        <View style={[styles.vRule, { backgroundColor: theme.colors.outlineVariant }]} />

        <View style={styles.priceCol}>
          <Text style={[styles.priceLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.card.communityPriceLabel}
          </Text>
          {hasCommunity ? (
            <View style={styles.communityRow}>
              <Text style={[styles.priceValue, { color: palette.green900 }]}>
                {formatRupee(poll.communityExpectedPrice!)}
              </Text>
              {showDelta ? <PriceDelta differencePercentage={poll.differencePercentage!} /> : null}
            </View>
          ) : (
            <>
              <Text style={[styles.waitingTitle, { color: theme.colors.onSurface }]}>
                {farmerPriceStrings.card.communityPriceHiddenTitle}
              </Text>
              <Text style={[styles.priceCaption, { color: theme.colors.onSurfaceVariant }]}>
                {farmerPriceStrings.card.communityPriceHiddenBody(MINIMUM_VOTES_REQUIRED)}
              </Text>
              {poll.voteCount > 0 ? (
                <Text style={[styles.progressCaption, { color: palette.green900 }]}>
                  {farmerPriceStrings.card.communityPriceHiddenProgress(
                    poll.voteCount,
                    MINIMUM_VOTES_REQUIRED,
                  )}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      {state === 'invite' && !hasCommunity ? (
        <View style={[styles.inviteBlock, { backgroundColor: palette.green50 }]}>
          <Text style={[styles.inviteTitle, { color: palette.green900 }]}>
            {poll.voteCount === 0
              ? farmerPriceStrings.card.inviteTitle
              : farmerPriceStrings.card.invitePartialTitle(poll.voteCount)}
          </Text>
          <Text style={[styles.inviteBody, { color: theme.colors.onSurface }]}>
            {poll.voteCount === 0
              ? farmerPriceStrings.card.inviteBody(cropLabel, poll.district)
              : farmerPriceStrings.card.invitePartialBody(MINIMUM_VOTES_REQUIRED)}
          </Text>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        {hasCommunity ? (
          <View style={styles.metaLeft}>
            <Text style={[styles.metaLabel, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.card.confidenceLabel}
            </Text>
            <ConfidenceBadge confidence={poll.confidence} size="sm" />
          </View>
        ) : (
          <View style={styles.metaLeft} />
        )}
        <Text style={[styles.participants, { color: theme.colors.onSurfaceVariant }]}>
          {poll.voteCount === 0
            ? farmerPriceStrings.card.participantsNone(poll.district)
            : farmerPriceStrings.card.participantsSome(poll.voteCount)}
        </Text>
      </View>

      {(hasCommunity || poll.marketSignals.length > 0 || state !== 'invite') && (
        <>
          <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.signalsBlock}>
            <Text style={[styles.signalsHeading, { color: theme.colors.onSurface }]}>
              {farmerPriceStrings.card.signalsHeading}
            </Text>
            <MarketSignals signals={poll.marketSignals} variant="compact" />
          </View>
        </>
      )}

      {state === 'invite' && poll.marketSignals.length === 0 ? (
        <Text style={[styles.signalsNudge, { color: theme.colors.onSurfaceVariant }]}>
          {`${farmerPriceStrings.card.signalsEmptyTitle} ${farmerPriceStrings.card.signalsEmptyBody}`}
        </Text>
      ) : null}

      <Button
        mode={state === 'invite' ? 'contained' : 'contained-tonal'}
        onPress={() => onOpen(poll.id, ctaFocus)}
        style={styles.action}
        contentStyle={styles.actionContent}
        labelStyle={styles.actionLabel}
        buttonColor={state === 'invite' ? palette.green700 : undefined}
        accessibilityLabel={ctaA11y}
      >
        {ctaLabel}
      </Button>
    </View>
  );
}

export const PollCard = memo(PollCardComponent);

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: 12,
  },
  banner: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerLeft: { flex: 1, gap: 2 },
  crop: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  district: {
    fontSize: 13,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  priceCol: { flex: 1, gap: 3 },
  vRule: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  priceLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  priceValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  priceValueMuted: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  waitingTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  priceCaption: {
    fontSize: 12,
    lineHeight: 16,
  },
  progressCaption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  inviteBlock: {
    borderRadius: radius.lg,
    padding: 12,
    gap: 4,
  },
  inviteTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  inviteBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  metaLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  participants: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  signalsBlock: { gap: spacing.sm },
  signalsHeading: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  signalsNudge: {
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    borderRadius: radius.lg,
  },
  actionContent: {
    height: 52,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
