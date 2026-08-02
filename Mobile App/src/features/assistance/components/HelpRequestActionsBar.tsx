import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { radius, spacing, typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';

type HelpRequestActionsBarProps = {
  supportCount: number;
  hasSupported: boolean;
  hasReported: boolean;
  isOwner: boolean;
  /** Support is only allowed while the request is OPEN. */
  canSupport?: boolean;
  supporting?: boolean;
  /** `full` stacks a wide support button for the detail screen. */
  variant?: 'compact' | 'full';
  onSupport: () => void;
  onShare: () => void;
  onReport: () => void;
};

/**
 * Support / Share / Report row. Button radius and content padding match
 * Marketplace listing detail action buttons.
 */
function HelpRequestActionsBarComponent({
  supportCount,
  hasSupported,
  hasReported,
  isOwner,
  canSupport = true,
  supporting = false,
  variant = 'compact',
  onSupport,
  onShare,
  onReport,
}: HelpRequestActionsBarProps) {
  const theme = useAppTheme();
  const isFull = variant === 'full';

  const supportLabel = hasSupported
    ? assistanceStrings.card.supported
    : assistanceStrings.card.support;

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, { color: theme.colors.onSurfaceVariant }]}>
        {supportCount > 0
          ? assistanceStrings.card.supportCount(supportCount)
          : assistanceStrings.card.supportCountEmpty}
      </Text>

      <View style={[styles.actions, isFull && styles.actionsFull]}>
        <Button
          mode={hasSupported ? 'contained-tonal' : 'contained'}
          icon={hasSupported ? 'hand-heart' : 'hand-heart-outline'}
          onPress={onSupport}
          loading={supporting}
          disabled={isOwner || hasSupported || supporting || !canSupport}
          style={[styles.actionButton, isFull && styles.fullWidth]}
          contentStyle={styles.actionButtonContent}
          compact={!isFull}
        >
          {supportLabel}
        </Button>

        <View style={styles.secondaryActions}>
          <Button
            mode="text"
            icon="share-variant-outline"
            onPress={onShare}
            style={styles.secondaryButton}
            contentStyle={styles.actionButtonContent}
            compact
          >
            {assistanceStrings.card.share}
          </Button>

          {!isOwner ? (
            <Button
              mode="text"
              icon="flag-outline"
              textColor={hasReported ? theme.colors.onSurfaceVariant : theme.colors.error}
              onPress={onReport}
              disabled={hasReported}
              style={styles.secondaryButton}
              contentStyle={styles.actionButtonContent}
              compact
            >
              {assistanceStrings.card.report}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const HelpRequestActionsBar = memo(HelpRequestActionsBarComponent);

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  actionsFull: { flexDirection: 'column', alignItems: 'stretch' },
  actionButton: { borderRadius: radius.md, alignSelf: 'flex-start' },
  fullWidth: { alignSelf: 'stretch' },
  actionButtonContent: { paddingVertical: spacing.xs },
  secondaryActions: { flexDirection: 'row', alignItems: 'center' },
  secondaryButton: { justifyContent: 'center' },
});
