import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/theme';

import {
  EDITABLE_HELP_REQUEST_STATUSES,
  HELP_REQUEST_STATUSES,
  STATUS_FILTER_ALL,
  type MyRequestsStatusFilter,
} from '../assistance.constants';
import { assistanceStrings, getHelpRequestStatusLabel } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import { saath, saathCard, saathPadX, saathText } from '../assistance.ui';
import {
  AssistanceEmptyView,
  AssistanceErrorView,
  AssistanceLoadingView,
} from '../components/AssistanceStateViews';
import { HelpRequestCard } from '../components/HelpRequestCard';
import { HelpRequestConfirmDialog } from '../components/HelpRequestConfirmDialog';
import { MyAssistanceSummaryCard } from '../components/MyAssistanceSummaryCard';
import { useHelpRequestLifecycle } from '../hooks/useHelpRequestLifecycle';
import { useMyAssistanceSummary } from '../hooks/useMyAssistanceSummary';
import { usePaginatedHelpRequests } from '../hooks/usePaginatedHelpRequests';

const FILTERS: MyRequestsStatusFilter[] = [STATUS_FILTER_ALL, ...HELP_REQUEST_STATUSES];

const CREATE_HREF = '/assistance-create' as Href;

const SCREEN_HEADER = {
  title: assistanceStrings.myRequests.title,
  headerShown: true,
  headerTitleAlign: 'center' as const,
  headerStyle: {
    backgroundColor: saath.cream,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: saath.line,
  },
  headerShadowVisible: false,
  headerTintColor: saath.heading,
  headerTitleStyle: {
    fontWeight: '700' as const,
    fontSize: 17,
    color: saath.heading,
  },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: saath.cream },
};

function filterChipColors(filter: MyRequestsStatusFilter, selected: boolean) {
  if (!selected) {
    return { backgroundColor: saath.white, borderColor: saath.line, color: saath.heading };
  }

  switch (filter) {
    case 'PENDING_REVIEW':
      return { backgroundColor: saath.amber, borderColor: saath.amber, color: saath.white };
    case 'REJECTED':
      return { backgroundColor: saath.error, borderColor: saath.error, color: saath.white };
    case 'RESOLVED':
    case 'ARCHIVED':
      return { backgroundColor: saath.mist, borderColor: saath.mist, color: saath.heading };
    case 'OPEN':
    case 'ALL':
    default:
      return { backgroundColor: saath.primary, borderColor: saath.primary, color: saath.white };
  }
}

/** The author's own requests across every status, with owner-only actions. */
export default function MyHelpRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padX = saathPadX(width);
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<MyRequestsStatusFilter>(STATUS_FILTER_ALL);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const list = usePaginatedHelpRequests({
    scope: 'mine',
    ...(statusFilter === STATUS_FILTER_ALL ? {} : { status: statusFilter }),
  });
  const summary = useMyAssistanceSummary();

  const { hasMore, loadMore, refresh: refreshList, replaceRequest, removeRequest } = list;
  const refreshSummary = summary.refresh;
  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      void refreshList();
      void refreshSummary();
    }, [refreshList, refreshSummary]),
  );

  const lifecycle = useHelpRequestLifecycle({
    onResolved: (request) => {
      if (statusFilter !== STATUS_FILTER_ALL && request.status !== statusFilter) {
        removeRequest(request.id);
      } else {
        replaceRequest(request);
      }
      void refreshSummary();
    },
    onDeleted: (requestId) => {
      removeRequest(requestId);
      void refreshSummary();
    },
  });

  const handleConfirmResolve = useCallback(async () => {
    const message = await lifecycle.confirmResolve();
    if (message) setSnackbar(message);
  }, [lifecycle]);

  const handleConfirmDelete = useCallback(async () => {
    const message = await lifecycle.confirmDelete();
    if (message) setSnackbar(message);
  }, [lifecycle]);

  const handleCreatePress = useCallback(() => {
    if (!summary.data.canCreate) {
      setSnackbar(assistanceStrings.create.limitReachedMessage);
      return;
    }
    router.push(CREATE_HREF);
  }, [router, summary.data.canCreate]);

  const handleCardPress = useCallback(
    (request: HelpRequest) => {
      router.push(`/assistance-request/${request.id}` as Href);
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const handlePullRefresh = useCallback(async () => {
    await Promise.all([refreshList(), refreshSummary()]);
  }, [refreshList, refreshSummary]);

  const renderItem = useCallback(
    ({ item }: { item: HelpRequest }) => {
      const canEdit = (EDITABLE_HELP_REQUEST_STATUSES as readonly string[]).includes(item.status);

      return (
        <View style={styles.itemShell}>
          <View style={styles.itemAccent} />
          <View style={styles.itemBody}>
            <HelpRequestCard
              request={item}
              onPress={handleCardPress}
              showActions={false}
              variant="mine"
            />

            <View style={styles.itemActions}>
              {canEdit ? (
                <Pressable
                  onPress={() => router.push(`/assistance-edit/${item.id}` as Href)}
                  disabled={lifecycle.loading}
                  accessibilityRole="button"
                  accessibilityLabel={assistanceStrings.detail.edit}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionEdit,
                    lifecycle.loading && styles.actionDisabled,
                    pressed && !lifecycle.loading && styles.actionPressed,
                  ]}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={saath.heading} />
                  <Text
                    style={[saathText.supportAction, { color: saath.heading }]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                  >
                    {assistanceStrings.detail.edit}
                  </Text>
                </Pressable>
              ) : null}

              {item.status === 'OPEN' ? (
                <Pressable
                  onPress={() => lifecycle.openResolveDialog(item.id)}
                  disabled={lifecycle.loading}
                  accessibilityRole="button"
                  accessibilityLabel={assistanceStrings.detail.markResolved}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionResolve,
                    lifecycle.loading && styles.actionDisabled,
                    pressed && !lifecycle.loading && styles.actionPressed,
                  ]}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={16} color={saath.primary} />
                  <Text
                    style={[saathText.supportAction, { color: saath.primary }]}
                    numberOfLines={1}
                    maxFontSizeMultiplier={1.2}
                  >
                    {assistanceStrings.detail.markResolved}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => lifecycle.openDeleteDialog(item.id)}
                disabled={lifecycle.loading}
                accessibilityRole="button"
                accessibilityLabel={assistanceStrings.detail.delete}
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.actionDelete,
                  lifecycle.loading && styles.actionDisabled,
                  pressed && !lifecycle.loading && styles.actionPressed,
                ]}
              >
                <MaterialCommunityIcons name="delete-outline" size={16} color={saath.error} />
                <Text
                  style={[saathText.supportAction, { color: saath.error }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                >
                  {assistanceStrings.detail.delete}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [handleCardPress, lifecycle, router],
  );

  const createDisabled = summary.loading || !!summary.error || !summary.data.canCreate;

  if (list.loading && list.requests.length === 0) {
    return (
      <>
        <Stack.Screen options={SCREEN_HEADER} />
        <AssistanceLoadingView message={assistanceStrings.myRequests.loading} />
      </>
    );
  }

  if (list.error && list.requests.length === 0) {
    return (
      <>
        <Stack.Screen options={SCREEN_HEADER} />
        <View style={styles.page}>
          <AssistanceErrorView
            title={assistanceStrings.feed.errorTitle}
            message={list.error}
            onAction={refreshList}
          />
        </View>
      </>
    );
  }

  const header = (
    <View style={styles.listHeader}>
      <MyAssistanceSummaryCard
        summary={summary.data}
        onCreatePress={handleCreatePress}
        createDisabled={createDisabled}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => {
          const selected = statusFilter === filter;
          const tone = filterChipColors(filter, selected);
          const label =
            filter === STATUS_FILTER_ALL
              ? assistanceStrings.myRequests.filterAll
              : getHelpRequestStatusLabel(filter);

          return (
            <Pressable
              key={filter}
              onPress={() => setStatusFilter(filter)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: tone.backgroundColor,
                  borderColor: tone.borderColor,
                },
                pressed && styles.filterPressed,
              ]}
            >
              <Text
                style={[saathText.chip, { color: tone.color }]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {list.error && list.requests.length > 0 ? (
        <Text style={[saathText.meta, { color: saath.error }]}>{list.error}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.page}>
      <Stack.Screen options={SCREEN_HEADER} />
      <FlatList
        data={list.requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: padX,
            paddingBottom: spacing.xl + Math.max(insets.bottom, 0),
          },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={handlePullRefresh}
            colors={[saath.primary]}
            tintColor={saath.primary}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <AssistanceEmptyView
            title={assistanceStrings.myRequests.emptyTitle}
            message={assistanceStrings.myRequests.emptyMessage}
            actionLabel={assistanceStrings.myRequests.createFirst}
            onAction={handleCreatePress}
          />
        }
        ListFooterComponent={
          list.loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator animating color={saath.primary} />
              <Text variant="bodySmall" style={{ color: saath.muted }}>
                {assistanceStrings.feed.loadMore}
              </Text>
            </View>
          ) : null
        }
      />

      <HelpRequestConfirmDialog
        visible={lifecycle.dialog === 'resolve'}
        title={assistanceStrings.lifecycle.resolveTitle}
        message={assistanceStrings.lifecycle.resolveMessage}
        confirmLabel={assistanceStrings.lifecycle.resolveConfirm}
        loading={lifecycle.loading}
        onDismiss={lifecycle.closeDialog}
        onConfirm={handleConfirmResolve}
      />

      <HelpRequestConfirmDialog
        visible={lifecycle.dialog === 'delete'}
        title={assistanceStrings.lifecycle.deleteTitle}
        message={assistanceStrings.lifecycle.deleteMessage}
        confirmLabel={assistanceStrings.lifecycle.deleteConfirm}
        loading={lifecycle.loading}
        destructive
        onDismiss={lifecycle.closeDialog}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: saath.cream },
  listContent: {
    paddingTop: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  listHeader: { gap: spacing.md },
  filterRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterPressed: { opacity: 0.88 },
  itemShell: {
    ...saathCard,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemAccent: {
    width: 4,
    backgroundColor: saath.primary,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: saath.line,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionEdit: {
    backgroundColor: saath.white,
    borderColor: saath.line,
  },
  actionResolve: {
    backgroundColor: saath.wash,
    borderColor: saath.washStrong,
  },
  actionDelete: {
    backgroundColor: saath.errorWash,
    borderColor: saath.errorWash,
  },
  actionDisabled: { opacity: 0.55 },
  actionPressed: { opacity: 0.86 },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
});
