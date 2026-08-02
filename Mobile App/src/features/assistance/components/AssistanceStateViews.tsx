import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';

type AssistanceStateViewProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function AssistanceLoadingView({
  message = assistanceStrings.feed.loading,
}: {
  message?: string;
}) {
  const theme = useAppTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator animating size="large" color={theme.colors.primary} />
      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>{message}</Text>
    </View>
  );
}

export function AssistanceErrorView({
  title,
  message,
  onAction,
}: AssistanceStateViewProps & { onAction?: () => void }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="alert-circle-outline"
        title={title}
        message={message}
        actionLabel={onAction ? assistanceStrings.feed.retry : undefined}
        onAction={onAction}
      />
    </View>
  );
}

export function AssistanceEmptyView({
  title,
  message,
  actionLabel,
  onAction,
}: AssistanceStateViewProps) {
  return (
    <EmptyState
      icon="hand-heart-outline"
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
