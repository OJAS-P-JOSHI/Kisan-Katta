import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabBarOverlayInset } from '@/components/navigation/tabBar.theme';
import { spacing } from '@/theme';

import { SEARCH_DEBOUNCE_MS } from './assistance.constants';
import { assistanceStrings } from './assistance.strings';
import type { HelpRequest, HelpRequestSortOption } from './assistance.types';
import { saath, saathPadX, saathShadow, saathText } from './assistance.ui';
import {
  AssistanceEmptyView,
  AssistanceErrorView,
} from './components/AssistanceStateViews';
import { AssistanceHero } from './components/AssistanceHero';
import { AssistanceInfoSheet } from './components/AssistanceInfoSheet';
import { AssistanceSearchField } from './components/AssistanceSearchField';
import { AssistanceSortChips } from './components/AssistanceSortChips';
import { HelpRequestCard } from './components/HelpRequestCard';
import { HelpRequestSkeleton } from './components/HelpRequestSkeleton';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useHelpRequestActions } from './hooks/useHelpRequestActions';
import { useMyAssistanceSummary } from './hooks/useMyAssistanceSummary';
import { usePaginatedHelpRequests } from './hooks/usePaginatedHelpRequests';

const CREATE_HREF = '/assistance-create' as Href;
const MY_REQUESTS_HREF = '/assistance-my-requests' as Href;

/**
 * Assistance public feed. Search, sort, pagination, support, quota, and
 * navigation are unchanged — this file restyles the main साथ experience.
 */
export default function AssistanceScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const padX = saathPadX(width);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<HelpRequestSortOption>('newest');
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const debouncedSearch = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  const feed = usePaginatedHelpRequests({
    scope: 'feed',
    sort,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  });

  const summary = useMyAssistanceSummary();
  const actions = useHelpRequestActions({ onRequestUpdated: feed.replaceRequest });

  const { hasMore, loadMore, refresh: refreshFeed } = feed;
  const refreshSummary = summary.refresh;

  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      void refreshFeed();
      void refreshSummary();
    }, [refreshFeed, refreshSummary]),
  );

  const handleCardPress = useCallback(
    (request: HelpRequest) => {
      router.push(`/assistance-request/${request.id}` as Href);
    },
    [router],
  );

  const handleSupport = useCallback(
    async (request: HelpRequest) => {
      const message = await actions.support(request);
      if (message) setSnackbar(message);
    },
    [actions, setSnackbar],
  );

  const handleCreatePress = useCallback(() => {
    if (!summary.data.canCreate) {
      setSnackbar(assistanceStrings.create.limitReachedMessage);
      return;
    }
    router.push(CREATE_HREF);
  }, [router, setSnackbar, summary.data.canCreate]);

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const handleMyRequests = useCallback(() => {
    router.push(MY_REQUESTS_HREF);
  }, [router]);

  const renderCountRef = useRef(0);

  const renderItem = useCallback(
    ({ item }: { item: HelpRequest }) => {
      if (__DEV__) {
        renderCountRef.current += 1;
      }
      return (
        <HelpRequestCard
          request={item}
          supporting={actions.supportingId === item.id}
          onPress={handleCardPress}
          onSupport={handleSupport}
        />
      );
    },
    [actions.supportingId, handleCardPress, handleSupport],
  );

  useEffect(() => {
    if (!__DEV__ || feed.loading) return;
    renderCountRef.current = 0;
    console.log('[AssistanceFeed]', {
      apiOrHookStoreCount: feed.requests.length,
      flatListDataCount: feed.requests.length,
      total: feed.total,
      hasMore: feed.hasMore,
      sort,
      search: debouncedSearch.trim() || null,
    });
    const timer = setTimeout(() => {
      console.log('[AssistanceFeed] renderItem executions (so far):', renderCountRef.current);
    }, 300);
    return () => clearTimeout(timer);
  }, [
    debouncedSearch,
    feed.hasMore,
    feed.loading,
    feed.requests,
    feed.total,
    sort,
  ]);

  const emptyMessage = debouncedSearch.trim()
    ? assistanceStrings.feed.searchEmptyMessage
    : assistanceStrings.feed.emptyMessage;

  /** Dock overlays the feed, and the FAB sits just above it — clear both. */
  const fabBottom = tabBarOverlayInset(insets.bottom) + spacing.xs;
  const listBottomPad = fabBottom + spacing.xxl;

  const listBody = () => {
    if (feed.loading) {
      return (
        <View style={[styles.skeletonWrap, { paddingHorizontal: padX }]}>
          <HelpRequestSkeleton count={3} />
        </View>
      );
    }

    if (feed.error && feed.requests.length === 0) {
      return (
        <AssistanceErrorView
          title={assistanceStrings.feed.errorTitle}
          message={feed.error}
          onAction={refreshFeed}
        />
      );
    }

    return (
      <FlatList
        data={feed.requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: padX, paddingBottom: listBottomPad },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={refreshFeed}
            colors={[saath.primary]}
            tintColor={saath.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <AssistanceEmptyView
            title={assistanceStrings.feed.emptyTitle}
            message={emptyMessage}
            actionLabel={assistanceStrings.feed.createRequest}
            onAction={handleCreatePress}
          />
        }
        ListFooterComponent={
          feed.loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator animating color={saath.primary} />
              <Text variant="bodySmall" style={{ color: saath.muted }}>
                {assistanceStrings.feed.loadMore}
              </Text>
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        ListHeaderComponent={
          feed.error ? (
            <Text variant="bodySmall" style={styles.inlineError}>
              {feed.error}
            </Text>
          ) : null
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <AssistanceHero onInfo={() => setInfoVisible(true)} />
      <AssistanceSearchField value={searchQuery} onChangeText={setSearchQuery} />
      <AssistanceSortChips selected={sort} onSelect={setSort} />

      {listBody()}

      <Pressable
        onPress={handleMyRequests}
        accessibilityRole="button"
        accessibilityLabel={assistanceStrings.feed.myRequests}
        style={({ pressed }) => [
          styles.fab,
          { bottom: fabBottom, right: padX },
          pressed && styles.fabPressed,
        ]}
      >
        <MaterialCommunityIcons name="clipboard-list-outline" size={22} color={saath.white} />
        <Text
          style={[saathText.supportAction, styles.fabLabel, { color: saath.white }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {assistanceStrings.feed.myRequests}
        </Text>
      </Pressable>

      <AssistanceInfoSheet visible={infoVisible} onDismiss={() => setInfoVisible(false)} />

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={{ marginBottom: fabBottom }}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: saath.cream },
  skeletonWrap: { flex: 1, paddingTop: spacing.xs },
  list: { flex: 1 },
  listContent: {
    paddingTop: spacing.xs,
    gap: spacing.md,
    flexGrow: 1,
  },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  footerSpacer: { height: spacing.xl },
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: 26,
    backgroundColor: saath.primary,
    ...saathShadow.card,
  },
  fabPressed: { opacity: 0.9 },
  fabLabel: { fontSize: 15, lineHeight: 20 },
  inlineError: { color: saath.error, marginBottom: spacing.sm },
});
