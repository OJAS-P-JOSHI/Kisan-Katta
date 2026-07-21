import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { BrandLeaves } from '@/components/BrandLeaves';
import { buttonSurface, iconSize, radius, spacing, typography, useAppTheme } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};

/**
 * Premium agriculture-branded empty state with a faint leaf backdrop.
 */
export function EmptyState({
  title,
  message,
  icon = 'sprout-outline',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.root}>
      <BrandLeaves variant="empty" />
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={iconSize.xl} color={theme.colors.primary} />
      </View>
      <Text style={[typography.sectionTitle, { color: theme.colors.onSurface, textAlign: 'center' }]}>
        {title}
      </Text>
      {message ? (
        <Text
          style={[typography.body, styles.message, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          onPress={onAction}
          style={[buttonSurface, styles.action]}
          contentStyle={styles.actionContent}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    flexGrow: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  actionContent: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
});
