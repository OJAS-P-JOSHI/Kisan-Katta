import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { spacing, typography, useAppTheme } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';

type ListingStateViewProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
};

export function ListingLoadingView({ message = marketplaceStrings.listings.loading }: { message?: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator animating size="large" color={theme.colors.primary} />
      <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
}

export function ListingErrorView({ title, message, onRetry }: ListingStateViewProps) {
  const theme = useAppTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="alert-circle-outline"
        title={title}
        message={message}
        actionLabel={onRetry ? marketplaceStrings.listings.retry : undefined}
        onAction={onRetry}
      />
    </View>
  );
}

export function ListingEmptyView({ title, message }: ListingStateViewProps) {
  return <EmptyState icon="sprout-outline" title={title} message={message} />;
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
