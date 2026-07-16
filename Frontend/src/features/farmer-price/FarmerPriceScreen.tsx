import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text as RNText, View } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { OrganicBackground } from '@/components/OrganicBackground';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import {
  buttonSurface,
  spacing,
  typography,
  useAppTheme,
} from '@/theme';

import { FarmerPriceSkeleton } from './components/FarmerPriceSkeleton';
import { PollBlock } from './components/PollBlock';
import { farmerPriceStrings } from './farmer-price.strings';
import type { PollDetailResponseDTO, SubmittedVoteLocal } from './farmer-price.types';
import { useMyFarmerPricePoll } from './hooks/useMyFarmerPricePoll';

export default function FarmerPriceScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile, loading: profileLoading } = useMyProfile();
  const {
    polls,
    submittedVotes,
    loading,
    refreshing,
    error,
    refresh,
    setPollDetail,
    setSubmittedVote,
  } = useMyFarmerPricePoll();

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const hasFavorites = (profile?.favoriteCrops?.length ?? 0) > 0;
  const isInitialLoading = (loading || profileLoading) && polls.length === 0 && !error;

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleVoted = useCallback(
    (poll: PollDetailResponseDTO, vote: SubmittedVoteLocal) => {
      setPollDetail(poll);
      setSubmittedVote(vote);
      setSnackbar(farmerPriceStrings.snackbar.voteSuccess);
    },
    [setPollDetail, setSubmittedVote],
  );

  const handleAlreadyVoted = useCallback(
    (pollId: string) => {
      setSubmittedVote({
        pollId,
        expectedPrice: 0,
        submittedAt: new Date().toISOString(),
      });
      void refresh();
    },
    [refresh, setSubmittedVote],
  );

  const openProfile = useCallback(() => {
    router.push('/profile' as Href);
  }, [router]);

  const renderBody = () => {
    if (isInitialLoading) {
      return <FarmerPriceSkeleton />;
    }

    if (error && polls.length === 0) {
      return (
        <EmptyState
          icon="wifi-off"
          title={farmerPriceStrings.network.title}
          message={error || farmerPriceStrings.network.message}
          actionLabel={farmerPriceStrings.network.retry}
          onAction={() => {
            void handleRefresh();
          }}
        />
      );
    }

    if (!profileLoading && profile && !hasFavorites) {
      return (
        <View style={styles.emptyWrap}>
          <RNText style={styles.emoji}>{farmerPriceStrings.empty.noFavoritesEmoji}</RNText>
          <Text style={[typography.sectionTitle, styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.empty.noFavoritesTitle}
          </Text>
          <Button
            mode="contained"
            onPress={openProfile}
            style={[buttonSurface, styles.emptyAction]}
            contentStyle={styles.emptyActionContent}
            accessibilityLabel={farmerPriceStrings.empty.openProfile}
          >
            {farmerPriceStrings.empty.openProfile}
          </Button>
        </View>
      );
    }

    if (!loading && polls.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <RNText style={styles.emoji}>{farmerPriceStrings.empty.noPollEmoji}</RNText>
          <Text style={[typography.sectionTitle, styles.emptyTitle, { color: theme.colors.onSurface }]}>
            {farmerPriceStrings.empty.noPollTitle}
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              void handleRefresh();
            }}
            style={[buttonSurface, styles.emptyAction]}
            contentStyle={styles.emptyActionContent}
            accessibilityLabel={farmerPriceStrings.empty.refresh}
          >
            {farmerPriceStrings.empty.refresh}
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.pollStack}>
        {polls.map((poll) => (
          <PollBlock
            key={poll.id}
            poll={poll}
            submittedVote={submittedVotes[poll.id]}
            onVoted={handleVoted}
            onError={setSnackbar}
            onAlreadyVoted={handleAlreadyVoted}
          />
        ))}

        <View style={styles.disclaimer}>
          <Text style={[typography.caption, styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.disclaimer.line1}
          </Text>
          <Text style={[typography.caption, styles.disclaimerText, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.disclaimer.line2}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <OrganicBackground intensity="subtle" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text
            style={[typography.largeHeading, styles.screenTitle, { color: theme.colors.onBackground }]}
          >
            {farmerPriceStrings.screen.title}
          </Text>
          <Text style={[typography.body, styles.screenSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            {farmerPriceStrings.screen.subtitle}
          </Text>
        </View>

        {renderBody()}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  screenTitle: {
    fontSize: 30,
    lineHeight: 38,
  },
  screenSubtitle: {},
  pollStack: {
    gap: spacing.lg,
  },
  disclaimer: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  disclaimerText: {
    textAlign: 'center',
  },
  emptyWrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAction: {
    marginTop: spacing.md,
  },
  emptyActionContent: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
});
