import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text } from 'react-native-paper';

import { radius, spacing, useAppTheme } from '@/theme';

import { EDITABLE_HELP_REQUEST_STATUSES } from '../assistance.constants';
import { getAssistanceErrorMessage } from '../assistance.errors';
import { getHelpRequestById } from '../assistance.service';
import {
  assistanceStrings,
  getHelpRequestStatusHelp,
  getHelpRequestStatusLabel,
} from '../assistance.strings';
import type { HelpRequest } from '../assistance.types';
import { formatHelpRequestDate } from '../assistance.utils';
import { AuthorIdentity } from '../components/AuthorIdentity';
import { AssistanceErrorView, AssistanceLoadingView } from '../components/AssistanceStateViews';
import { HelpRequestActionsBar } from '../components/HelpRequestActionsBar';
import { HelpRequestConfirmDialog } from '../components/HelpRequestConfirmDialog';
import { HelpRequestStatusChip } from '../components/HelpRequestStatusChip';
import { ProofPhotoCarousel } from '../components/ProofPhotoCarousel';
import { ReportRequestDialog } from '../components/ReportRequestDialog';
import { useHelpRequestActions } from '../hooks/useHelpRequestActions';
import { useHelpRequestLifecycle } from '../hooks/useHelpRequestLifecycle';

/** Full help request: proof photos, author snapshot, status, and actions. */
export default function HelpRequestDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isDeleted, setIsDeleted] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchRequest = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError(assistanceStrings.errors.generic);
      setLoading(false);
      return;
    }

    try {
      const data = await getHelpRequestById(id);
      setRequest(data);
      setError(null);
      hasLoadedRef.current = true;
    } catch (err) {
      const message = getAssistanceErrorMessage(err);
      setError(message);
      if (hasLoadedRef.current) {
        setSnackbar(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void fetchRequest();
    }, [fetchRequest]),
  );

  const actions = useHelpRequestActions({ onRequestUpdated: setRequest });

  const lifecycle = useHelpRequestLifecycle({
    onResolved: setRequest,
    onDeleted: () => {
      setIsDeleted(true);
      setTimeout(() => router.back(), 1200);
    },
  });

  const handleSupport = useCallback(async () => {
    if (!request) return;
    const message = await actions.support(request);
    if (message) setSnackbar(message);
  }, [actions, request]);

  const handleShare = useCallback(async () => {
    if (!request) return;
    const message = await actions.share(request);
    if (message) setSnackbar(message);
  }, [actions, request]);

  const handleReport = useCallback(() => {
    if (request) actions.openReport(request);
  }, [actions, request]);

  const handleSubmitReport = useCallback(
    async (payload: Parameters<typeof actions.submitReport>[0]) => {
      const message = await actions.submitReport(payload);
      if (message) setSnackbar(message);
    },
    [actions],
  );

  const handleConfirmResolve = useCallback(async () => {
    const message = await lifecycle.confirmResolve();
    if (message) setSnackbar(message);
  }, [lifecycle]);

  const handleConfirmDelete = useCallback(async () => {
    const message = await lifecycle.confirmDelete();
    if (message) setSnackbar(message);
  }, [lifecycle]);

  if (loading && !request) {
    return <AssistanceLoadingView message={assistanceStrings.detail.loading} />;
  }

  if (!request) {
    return (
      <AssistanceErrorView
        title={assistanceStrings.detail.errorTitle}
        message={error ?? assistanceStrings.errors.generic}
        onAction={fetchRequest}
      />
    );
  }

  const canEdit =
    request.isOwner &&
    !isDeleted &&
    (EDITABLE_HELP_REQUEST_STATUSES as readonly string[]).includes(request.status);
  const canResolve = request.isOwner && !isDeleted && request.status === 'OPEN';
  const ownerActionsDisabled = lifecycle.loading || isDeleted;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        <ProofPhotoCarousel images={request.images} />

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, flex: 1 }}
              >
                {request.title}
              </Text>
              <HelpRequestStatusChip status={request.status} compact={false} />
            </View>

            {request.isOwner ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {getHelpRequestStatusHelp(request.status)}
              </Text>
            ) : null}

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <AuthorIdentity author={request.author} postedAt={request.createdAt} size={52} />

            <DetailRow label={assistanceStrings.detail.village} value={request.author.village} />
            <DetailRow label={assistanceStrings.detail.taluka} value={request.author.taluka} />
            <DetailRow label={assistanceStrings.detail.district} value={request.author.district} />
            <DetailRow label={assistanceStrings.detail.state} value={request.author.state} />
            <DetailRow
              label={assistanceStrings.detail.postedOn}
              value={formatHelpRequestDate(request.createdAt)}
            />
            <DetailRow
              label={assistanceStrings.detail.status}
              value={getHelpRequestStatusLabel(request.status)}
            />

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {assistanceStrings.detail.description}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {request.description}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
          <Card.Content style={styles.cardContent}>
            <HelpRequestActionsBar
              supportCount={request.supportCount}
              hasSupported={request.hasSupported}
              hasReported={request.hasReported}
              isOwner={request.isOwner}
              canSupport={request.status === 'OPEN'}
              supporting={actions.supportingId === request.id}
              variant="full"
              onSupport={handleSupport}
              onShare={handleShare}
              onReport={handleReport}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {assistanceStrings.support.notMoney}
            </Text>
          </Card.Content>
        </Card>

        {request.isOwner ? (
          <View style={styles.ownerActions}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {assistanceStrings.detail.ownerActions}
            </Text>

            {canEdit ? (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => router.push(`/assistance-edit/${request.id}` as Href)}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                disabled={ownerActionsDisabled}
              >
                {assistanceStrings.detail.edit}
              </Button>
            ) : null}

            {canResolve ? (
              <Button
                mode="outlined"
                icon="check-circle-outline"
                onPress={() => lifecycle.openResolveDialog(request.id)}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                disabled={ownerActionsDisabled}
                loading={lifecycle.loading && lifecycle.dialog === 'resolve'}
              >
                {assistanceStrings.detail.markResolved}
              </Button>
            ) : null}

            {!isDeleted ? (
              <Button
                mode="outlined"
                icon="delete-outline"
                textColor={theme.colors.error}
                onPress={() => lifecycle.openDeleteDialog(request.id)}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
                disabled={ownerActionsDisabled}
                loading={lifecycle.loading && lifecycle.dialog === 'delete'}
              >
                {assistanceStrings.detail.delete}
              </Button>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <ReportRequestDialog
        visible={!!actions.reportTarget}
        submitting={actions.reportSubmitting}
        onDismiss={actions.closeReport}
        onSubmit={handleSubmitReport}
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
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  if (!value) return null;

  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: { borderRadius: radius.lg },
  cardContent: { gap: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  divider: { marginVertical: spacing.sm },
  detailRow: { gap: spacing.xs },
  ownerActions: { gap: spacing.sm },
  actionButton: { borderRadius: radius.md },
  actionButtonContent: { paddingVertical: spacing.xs },
});
