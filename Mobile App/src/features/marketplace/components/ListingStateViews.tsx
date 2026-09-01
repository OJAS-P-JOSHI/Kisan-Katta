import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

import { EmptyState } from '@/components/EmptyState';
import { spacing, typography } from '@/theme';

import { marketplaceStrings } from '../marketplace.strings';
import { mp } from '../marketplace.ui';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type ListingStateViewProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  icon?: IconName;
};

export function ListingLoadingView({ message = marketplaceStrings.listings.loading }: { message?: string }) {
  return (
    <View style={[styles.centered, { backgroundColor: mp.cream }]}>
      <ActivityIndicator animating size="large" color={mp.primaryGreen} />
      <Text style={[typography.body, { color: mp.bodyGrey }]}>{message}</Text>
    </View>
  );
}

export function ListingErrorView({ title, message, onRetry }: ListingStateViewProps) {
  return (
    <View style={[styles.centered, { backgroundColor: mp.cream }]}>
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

export function ListingEmptyView({ title, message, icon }: ListingStateViewProps) {
  return <EmptyState icon={icon ?? 'sprout-outline'} title={title} message={message} />;
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
