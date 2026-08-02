import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Chip, Snackbar, Text } from 'react-native-paper';

import { radius, spacing, typography, buttonSurface, useAppTheme } from '@/theme';

import {
  EDITABLE_HELP_REQUEST_STATUSES,
  HELP_REQUEST_STATUSES,
  STATUS_FILTER_ALL,
  type MyRequestsStatusFilter,
} from '../assistance.constants';
import { assistanceStrings, getHelpRequestStatusLabel } from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
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

/** The author's own requests across every status, with owner-only actions. */
export default function MyHelpRequestsScreen() {
  const theme = useAppTheme();
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
        <View style={styles.itemBlock}>
          <HelpRequestCard request={item} onPress={handleCardPress} showActions={false} />

          <View style={styles.itemActions}>
            {canEdit ? (
              <Button
                mode="outlined"
                compact
                icon="pencil"
                onPress={() => router.push(`/assistance-edit/${item.id}` as Href)}
                style={styles.itemActionButton}
                disabled={lifecycle.loading}
              >
                {assistanceStrings.detail.edit}
              </Button>
            ) : null}

            {item.status === 'OPEN' ? (
              <Button
                mode="outlined"
                compact
                icon="check-circle-outline"
                onPress={() => lifecycle.openResolveDialog(item.id)}
                style={styles.itemActionButton}
                disabled={lifecycle.loading}
              >
                {assistanceStrings.detail.markResolved}
              </Button>
            ) : null}

            <Button
              mode="text"
              compact
              icon="delete-outline"
              textColor={theme.colors.error}
              onPress={() => lifecycle.openDeleteDialog(item.id)}
              disabled={lifecycle.loading}
            >
              {assistanceStrings.detail.delete}
            </Button>
          </View>
        </View>
      );
    },
    [handleCardPress, lifecycle, router, theme.colors.error],
  );

  if (list.loading && list.requests.length === 0) {
    return <AssistanceLoadingView message={assistanceStrings.myRequests.loading} />;
  }

  if (list.error && list.requests.length === 0) {
    return (
      <AssistanceErrorView
        title={assistanceStrings.feed.errorTitle}
        message={list.error}
        onAction={refreshList}
      />
    );
  }

  const header = (
    <View style={styles.header}>
      <MyAssistanceSummaryCard summary={summary.data} />

      <Button
        mode="contained"
        icon="hand-heart-outline"
        onPress={handleCreatePress}
        disabled={summary.loading || !!summary.error || !summary.data.canCreate}
        style={styles.createButton}
        contentStyle={styles.createButtonContent}
      >
        {assistanceStrings.feed.createRequest}
      </Button>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => (
          <Chip
            key={filter}
            selected={statusFilter === filter}
            showSelectedCheck={false}
            onPress={() => setStatusFilter(filter)}
            style={[
              styles.filterChip,
              statusFilter === filter && { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            {filter === STATUS_FILTER_ALL
              ? assistanceStrings.myRequests.filterAll
              : getHelpRequestStatusLabel(filter)}
          </Chip>
        ))}
      </ScrollView>

      {list.error && list.requests.length > 0 ? (
        <Text style={[typography.caption, { color: theme.colors.error }]}>{list.error}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={list.requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={handlePullRefresh}
            colors={[theme.colors.primary]}
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
              <ActivityIndicator animating color={theme.colors.primary} />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
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
  container: { flex: 1 },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  header: { gap: spacing.md },
  createButton: { ...buttonSurface },
  createButtonContent: { paddingVertical: spacing.xs },
  filterRow: { gap: spacing.sm, paddingRight: spacing.md },
  filterChip: { borderRadius: radius.pill },
  itemBlock: { gap: spacing.xs },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  itemActionButton: { borderRadius: radius.sm },
  footer: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs },
});
