import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB, IconButton, Searchbar, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useAppTheme } from '@/theme';

import { SEARCH_DEBOUNCE_MS } from './assistance.constants';
import { assistanceStrings } from './assistance.strings';
import type { HelpRequest, HelpRequestSortOption } from './assistance.types';
import {
  AssistanceEmptyView,
  AssistanceErrorView,
  AssistanceLoadingView,
} from './components/AssistanceStateViews';
import { AssistanceInfoSheet } from './components/AssistanceInfoSheet';
import { AssistanceSortChips } from './components/AssistanceSortChips';
import { HelpRequestCard } from './components/HelpRequestCard';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { useHelpRequestActions } from './hooks/useHelpRequestActions';
import { useMyAssistanceSummary } from './hooks/useMyAssistanceSummary';
import { usePaginatedHelpRequests } from './hooks/usePaginatedHelpRequests';

const CREATE_HREF = '/assistance-create' as Href;
const MY_REQUESTS_HREF = '/assistance-my-requests' as Href;

/**
 * Assistance public feed — layout, search, chips, list spacing, and loading
 * states mirror Marketplace `ListingsBrowse`.
 */
export default function AssistanceScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    [actions],
  );

  const handleCreatePress = useCallback(() => {
    if (!summary.data.canCreate) {
      setSnackbar(assistanceStrings.create.limitReachedMessage);
      return;
    }
    router.push(CREATE_HREF);
  }, [router, summary.data.canCreate]);

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

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

  if (feed.loading) {
    return <AssistanceLoadingView />;
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

  const emptyMessage = debouncedSearch.trim()
    ? assistanceStrings.feed.searchEmptyMessage
    : assistanceStrings.feed.emptyMessage;

  const fabDisabled = summary.loading || !!summary.error || !summary.data.canCreate;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.searchWrap, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.toolbar}>
          <IconButton
            icon="clipboard-list-outline"
            size={22}
            iconColor={theme.colors.primary}
            onPress={() => router.push(MY_REQUESTS_HREF)}
            style={styles.toolbarButton}
            accessibilityLabel={assistanceStrings.feed.myRequests}
          />
          <IconButton
            icon="information-outline"
            size={22}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={() => setInfoVisible(true)}
            style={styles.toolbarButton}
            accessibilityLabel={assistanceStrings.feed.infoA11y}
          />
        </View>

        <Searchbar
          placeholder={assistanceStrings.feed.searchPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchbar, { backgroundColor: theme.colors.surface }]}
          inputStyle={styles.searchInput}
          icon={() => (
            <MaterialCommunityIcons name="magnify" size={22} color={theme.colors.onSurfaceVariant} />
          )}
        />
      </View>

      <AssistanceSortChips selected={sort} onSelect={setSort} />

      <FlatList
        data={feed.requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.refreshing}
            onRefresh={refreshFeed}
            colors={[theme.colors.primary]}
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
              <ActivityIndicator animating color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {assistanceStrings.feed.loadMore}
              </Text>
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        ListHeaderComponent={
          feed.error ? (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.error, marginBottom: spacing.sm }}
            >
              {feed.error}
            </Text>
          ) : null
        }
      />

      <FAB
        icon="plus"
        label={assistanceStrings.feed.createRequest}
        onPress={handleCreatePress}
        disabled={fabDisabled}
        style={[
          styles.fab,
          {
            bottom: insets.bottom + spacing.md,
            backgroundColor: fabDisabled
              ? theme.colors.surfaceDisabled
              : theme.colors.primary,
          },
        ]}
        color={theme.colors.onPrimary}
      />

      <AssistanceInfoSheet visible={infoVisible} onDismiss={() => setInfoVisible(false)} />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: spacing.md, gap: spacing.xs },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: -spacing.xs,
  },
  toolbarButton: { margin: 0, width: 40, height: 40 },
  searchbar: { borderRadius: 12, elevation: 0 },
  searchInput: { minHeight: 0 },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.md,
    flexGrow: 1,
  },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
  footerSpacer: { height: spacing.xl },
  fab: { position: 'absolute', right: spacing.md },
});
