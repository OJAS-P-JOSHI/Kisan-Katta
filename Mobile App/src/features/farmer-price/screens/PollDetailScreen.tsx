import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { ActivityIndicator, Button, ProgressBar, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { OrganicBackground } from '@/components/OrganicBackground';
import { getCropLabel, useCrops } from '@/features/crop';
import { cardSurface, palette, radius, spacing, useAppTheme } from '@/theme';

import { CommunityInsights } from '../components/CommunityInsights';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { MarketSignals } from '../components/MarketSignals';
import { deltaTone, PriceDelta } from '../components/PriceDelta';
import { ThankYouCard } from '../components/ThankYouCard';
import { VoteCard } from '../components/VoteCard';
import { MINIMUM_VOTES_REQUIRED } from '../farmer-price.constants';
import { farmerPriceStrings } from '../farmer-price.strings';
import type { ReasonType } from '../farmer-price.types';
import {
  formatCompactRemaining,
  formatRupee,
  remainingProgress,
} from '../farmer-price.utils';
import { useFarmerPricePollDetail } from '../hooks/useFarmerPricePollDetail';
import { useSubmitFarmerVote } from '../hooks/useSubmitFarmerVote';

/**
 * Unvoted: Government → Share Opinion (first action) → community context below.
 * Voted: Thank-you + community statistics (community mode).
 */
export default function PollDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { pollId, focus } = useLocalSearchParams<{ pollId: string; focus?: string }>();
  const { data: crops } = useCrops();

  const {
    poll,
    displayVote,
    loading,
    refreshing,
    error,
    refresh,
    applyVoteResult,
  } = useFarmerPricePollDetail(typeof pollId === 'string' ? pollId : '');
  const { submitting, submit } = useSubmitFarmerVote();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const voteOffsetRef = useRef(0);
  const hasScrolledToVote = useRef(false);

  const cropLabel = useMemo(
    () => (poll ? getCropLabel(poll.crop, crops) || poll.crop : ''),
    [crops, poll],
  );

  const hasVoted = !!poll?.hasVoted;
  const preferVoteFocus = focus === 'vote' || !hasVoted;

  const handleSubmit = useCallback(
    async (payload: { expectedPrice: number; reasonType?: ReasonType; reasonText?: string }) => {
      if (!poll) return;
      const result = await submit(poll.id, payload);
      if (!result.ok) {
        if (result.alreadyVoted) {
          // Backend is source of truth — re-fetch hasVoted / myVote.
          void refresh();
        }
        setSnackbar(result.message);
        return;
      }
      applyVoteResult(result.poll, result.vote);
      // Pull fresh aggregates so the farmer sees updated counts immediately.
      void refresh();
      setSnackbar(farmerPriceStrings.snackbar.voteSuccess);
      // Bring the thank-you + stats into view after submit.
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    },
    [applyVoteResult, poll, refresh, submit],
  );

  const onVoteLayout = useCallback((event: LayoutChangeEvent) => {
    voteOffsetRef.current = event.nativeEvent.layout.y;
  }, []);

  useEffect(() => {
    if (!poll || hasVoted || hasScrolledToVote.current) return;
    if (!preferVoteFocus) return;
    // Small delay so layout settles, then land on the opinion form.
    const timer = setTimeout(() => {
      if (voteOffsetRef.current > 0) {
        scrollRef.current?.scrollTo({
          y: Math.max(0, voteOffsetRef.current - 12),
          animated: true,
        });
        hasScrolledToVote.current = true;
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [hasVoted, poll, preferVoteFocus]);

  if (loading && !poll) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!poll) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="wifi-off"
          title={farmerPriceStrings.network.title}
          message={error || farmerPriceStrings.detail.notFound}
          actionLabel={farmerPriceStrings.detail.retry}
          onAction={() => {
            void refresh();
          }}
        />
      </View>
    );
  }

  const isClosed = poll.status === 'CLOSED' || poll.remainingHours <= 0;
  const hasCommunityPrice = poll.minimumVotesReached && poll.communityExpectedPrice !== null;
  const hasDelta =
    hasCommunityPrice && poll.governmentPriceAvailable && poll.differencePercentage != null;
  const deltaColors = hasDelta ? deltaTone(poll.differencePercentage!) : null;

  const differenceSentence = !hasDelta
    ? farmerPriceStrings.detail.differenceUnavailable
    : poll.differencePercentage! > 0
      ? farmerPriceStrings.detail.differenceHigher
      : poll.differencePercentage! < 0
        ? farmerPriceStrings.detail.differenceLower
        : farmerPriceStrings.detail.differenceEqual;

  const governmentCard = (
    <View style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.cardLabel, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.governmentPriceLabel}
      </Text>
      <Text style={[styles.referencePrice, { color: theme.colors.onSurface }]}>
        {poll.governmentPriceAvailable && poll.governmentPriceSnapshot !== null
          ? `${formatRupee(poll.governmentPriceSnapshot)} `
          : '—'}
        <Text style={[styles.unit, { color: theme.colors.onSurfaceVariant }]}>
          {farmerPriceStrings.card.perQuintal}
        </Text>
      </Text>
      <Text style={[styles.cardHint, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.governmentPriceHint}
      </Text>
    </View>
  );

  const communityCard = (
    <View style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.cardLabel, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.communityPriceLabel}
      </Text>
      {hasCommunityPrice ? (
        <>
          <Text style={[styles.communityPrice, { color: palette.green900 }]}>
            {`${formatRupee(poll.communityExpectedPrice!)} `}
            <Text style={[styles.unit, { color: theme.colors.onSurfaceVariant }]}>
              {farmerPriceStrings.card.perQuintal}
            </Text>
          </Text>
          <Text style={[styles.cardHint, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.detail.communityPriceHint}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.waiting, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.detail.communityWaitingTitle}
          </Text>
          <ProgressBar
            progress={Math.min(1, poll.voteCount / MINIMUM_VOTES_REQUIRED)}
            color={theme.colors.primary}
            style={[styles.voteProgress, { backgroundColor: theme.colors.surfaceVariant }]}
          />
          <Text style={[styles.cardHint, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.detail.communityWaitingBody(
              poll.voteCount,
              MINIMUM_VOTES_REQUIRED,
            )}
          </Text>
        </>
      )}
    </View>
  );

  const differenceCard = (
    <View
      style={[
        styles.card,
        cardSurface,
        { backgroundColor: deltaColors?.bg ?? theme.colors.surface },
      ]}
    >
      <Text style={[styles.cardLabel, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.differenceHeading}
      </Text>
      {hasDelta ? (
        <View style={styles.deltaRow}>
          <Text style={[styles.deltaAmount, { color: deltaColors!.fg }]}>
            {`${poll.differenceFromGovernmentPrice! > 0 ? '+' : ''}${formatRupee(
              poll.differenceFromGovernmentPrice!,
            )}`}
          </Text>
          <PriceDelta differencePercentage={poll.differencePercentage!} />
        </View>
      ) : null}
      <Text
        style={[
          styles.cardHint,
          { color: deltaColors ? deltaColors.fg : theme.colors.onSurfaceVariant },
        ]}
      >
        {differenceSentence}
      </Text>
    </View>
  );

  const statsRow = (
    <>
      <View style={[styles.statsRow, cardSurface, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.detail.statsVotes}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {poll.voteCount}
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.detail.statsConfidence}
          </Text>
          <ConfidenceBadge confidence={poll.confidence} size="sm" />
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.outlineVariant }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.detail.statsWindow}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {isClosed
              ? farmerPriceStrings.detail.windowClosed
              : formatCompactRemaining(poll.remainingHours)}
          </Text>
        </View>
      </View>
      <ProgressBar
        progress={remainingProgress(poll.remainingHours)}
        color={theme.colors.primary}
        style={[styles.windowProgress, { backgroundColor: theme.colors.surfaceVariant }]}
      />
    </>
  );

  const signalsCard = (
    <View style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.detail.signalsHeading}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.signalsSubtitle}
      </Text>
      <View style={styles.sectionBody}>
        <MarketSignals signals={poll.marketSignals} variant="full" />
      </View>
    </View>
  );

  const insightsCard = (
    <View style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {farmerPriceStrings.detail.insightsHeading}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        {farmerPriceStrings.detail.insightsSubtitle}
      </Text>
      <View style={styles.sectionBody}>
        <CommunityInsights insights={poll.recentInsights} />
      </View>
    </View>
  );

  const opinionSection = (
    <View
      style={[styles.card, cardSurface, { backgroundColor: theme.colors.surface }]}
      onLayout={onVoteLayout}
    >
      {hasVoted ? (
        <ThankYouCard
          vote={
            displayVote ?? {
              pollId: poll.id,
              expectedPrice: 0,
              submittedAt: new Date().toISOString(),
            }
          }
          district={poll.district}
          communityRevealed={hasCommunityPrice}
        />
      ) : isClosed ? (
        <View style={styles.closedBlock}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.vote.closedTitle}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.vote.closedBody}
          </Text>
        </View>
      ) : (
        <>
          {poll.voteCount === 0 ? (
            <Text style={[styles.firstVoice, { color: palette.green900 }]}>
              {farmerPriceStrings.vote.firstVoiceHint(cropLabel, poll.district)}
            </Text>
          ) : null}
          <VoteCard poll={poll} submitting={submitting} onSubmit={handleSubmit} />
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.crop, { color: theme.colors.onBackground }]}>{cropLabel}</Text>
          <Text style={[styles.district, { color: theme.colors.onSurfaceVariant }]}>
            {`📍 ${poll.district}`}
          </Text>
        </View>

        {hasVoted ? (
          <>
            {/* Community mode: confirmation first, then full picture */}
            {opinionSection}
            {governmentCard}
            {communityCard}
            {differenceCard}
            {statsRow}
            {signalsCard}
            {insightsCard}
          </>
        ) : (
          <>
            {/* Participation mode: government reference → vote immediately */}
            {governmentCard}
            {opinionSection}
            {communityCard}
            {differenceCard}
            {statsRow}
            {signalsCard}
            {insightsCard}
          </>
        )}

        <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
          {poll.disclaimer}
        </Text>

        {error ? (
          <Button
            mode="text"
            onPress={() => {
              void refresh();
            }}
            accessibilityLabel={farmerPriceStrings.detail.retry}
          >
            {farmerPriceStrings.detail.retry}
          </Button>
        ) : null}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3500}
        action={{
          label: farmerPriceStrings.snackbar.dismiss,
          onPress: () => setSnackbar(null),
        }}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  header: { gap: 2 },
  crop: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  district: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: spacing.md,
    gap: 6,
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  referencePrice: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  communityPrice: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  unit: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  waiting: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  voteProgress: {
    height: 6,
    borderRadius: radius.pill,
    marginVertical: 6,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deltaAmount: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  windowProgress: {
    height: 3,
    borderRadius: radius.pill,
    marginTop: -spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionBody: {
    paddingTop: spacing.sm,
  },
  firstVoice: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  closedBlock: { gap: 4 },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
