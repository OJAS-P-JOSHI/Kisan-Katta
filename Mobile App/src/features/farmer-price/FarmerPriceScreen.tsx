import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text as RNText, View, useWindowDimensions } from 'react-native';
import { Button, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScenicScreenHeader, ScenicSectionHeading, scenicPadX } from '@/components/branding/ScenicScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { tabBarContentInset, tabBarOverlayInset } from '@/components/navigation/tabBar.theme';
import { getCropLabel, useCrops } from '@/features/crop';
import { mp, mpRadius } from '@/features/marketplace/marketplace.ui';
import { useMyProfile } from '@/features/profile/hooks/useMyProfile';
import { spacing } from '@/theme';

import { FarmerPriceSkeleton } from './components/FarmerPriceSkeleton';
import { PollCard, type PollCardFocus } from './components/PollCard';
import { farmerPriceStrings } from './farmer-price.strings';
import { useMyFarmerPricePoll } from './hooks/useMyFarmerPricePoll';

export default function FarmerPriceScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padX = scenicPadX(width) + Math.max(insets.left, 0);
  const padXRight = scenicPadX(width) + Math.max(insets.right, 0);
  const router = useRouter();
  const { data: profile, loading: profileLoading } = useMyProfile();
  const { data: crops } = useCrops();
  const { polls, loading, refreshing, error, refresh, revalidate } =
    useMyFarmerPricePoll();

  /** Refresh failures surface as a dismissible snackbar over the cached list. */
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const snackbarError = error && polls.length > 0 && error !== dismissedError ? error : null;

  const hasFavorites = (profile?.favoriteCrops?.length ?? 0) > 0;
  const isInitialLoading = (loading || profileLoading) && polls.length === 0 && !error;

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  /** Statistics change while the farmer is on the detail screen — pull them back in. */
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      void revalidate();
    }, [revalidate]),
  );

  const openProfile = useCallback(() => {
    router.push('/profile' as Href);
  }, [router]);

  const openPoll = useCallback(
    (pollId: string, focus: PollCardFocus) => {
      router.push({
        pathname: '/farmer-price-detail/[pollId]',
        params: { pollId, focus },
      } as Href);
    },
    [router],
  );

  /** Labels resolved once here so each memoized card stays render-stable. */
  const cropLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const poll of polls) {
      map[poll.id] = getCropLabel(poll.crop, crops) || poll.crop;
    }
    return map;
  }, [crops, polls]);

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
          <Text style={styles.emptyTitle}>{farmerPriceStrings.empty.noFavoritesTitle}</Text>
          <Button
            mode="contained"
            onPress={openProfile}
            style={styles.emptyAction}
            contentStyle={styles.emptyActionContent}
            buttonColor={mp.primaryGreen}
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
          <Text style={styles.emptyTitle}>{farmerPriceStrings.empty.noPollTitle}</Text>
          <Button
            mode="contained"
            onPress={() => {
              void handleRefresh();
            }}
            style={styles.emptyAction}
            contentStyle={styles.emptyActionContent}
            buttonColor={mp.primaryGreen}
            accessibilityLabel={farmerPriceStrings.empty.refresh}
          >
            {farmerPriceStrings.empty.refresh}
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.pollStack}>
        <ScenicSectionHeading icon="sprout-outline" label={farmerPriceStrings.screen.listHeading} />

        {polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            cropLabel={cropLabels[poll.id] ?? poll.crop}
            hasVoted={poll.hasVoted}
            onOpen={openPoll}
          />
        ))}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{farmerPriceStrings.disclaimer.line1}</Text>
          <Text style={styles.disclaimerText}>{farmerPriceStrings.disclaimer.line2}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarContentInset(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
            colors={[mp.primaryGreen]}
            tintColor={mp.primaryGreen}
          />
        }
      >
        <ScenicScreenHeader
          title={farmerPriceStrings.screen.title}
          subtitle={farmerPriceStrings.screen.subtitle}
        />
        <View style={[styles.body, { paddingLeft: padX, paddingRight: padXRight }]}>
          {renderBody()}
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackbarError}
        onDismiss={() => setDismissedError(error)}
        duration={4000}
        style={{ marginBottom: tabBarOverlayInset(insets.bottom) }}
        action={{
          label: farmerPriceStrings.snackbar.dismiss,
          onPress: () => setDismissedError(error),
        }}
      >
        {snackbarError ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mp.cream,
  },
  content: {
    flexGrow: 1,
  },
  body: {
    paddingTop: 4,
    flexGrow: 1,
  },
  pollStack: {
    gap: 14,
  },
  disclaimer: {
    gap: 2,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    color: mp.muted,
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 280,
    color: mp.headingGreen,
  },
  emptyAction: {
    marginTop: spacing.md,
    borderRadius: mpRadius.control,
  },
  emptyActionContent: {
    height: 48,
    paddingHorizontal: spacing.md,
  },
});
