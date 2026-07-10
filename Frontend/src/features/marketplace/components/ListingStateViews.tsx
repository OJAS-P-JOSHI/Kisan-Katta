import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { spacing, useAppTheme } from '@/theme';

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
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {message}
      </Text>
    </View>
  );
}

export function ListingErrorView({ title, message, onRetry }: ListingStateViewProps) {
  const theme = useAppTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {title}
      </Text>
      {message ? (
        <Text variant="bodyMedium" style={[styles.centeredText, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
          {marketplaceStrings.listings.retry}
        </Button>
      ) : null}
    </View>
  );
}

export function ListingEmptyView({ title, message }: ListingStateViewProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="text-search" size={48} color={theme.colors.onSurfaceVariant} />
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {title}
      </Text>
      {message ? (
        <Text variant="bodyMedium" style={[styles.centeredText, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
      ) : null}
    </View>
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
  centeredText: { textAlign: 'center' },
  retryButton: { marginTop: spacing.sm },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
    flexGrow: 1,
  },
});
