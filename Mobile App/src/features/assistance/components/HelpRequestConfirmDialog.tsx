import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { typography, useAppTheme } from '@/theme';

import { assistanceStrings } from '../assistance.strings';

type HelpRequestConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  loading: boolean;
  destructive?: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
};

/** Confirmation for the owner-only resolve and delete actions. */
export function HelpRequestConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  loading,
  destructive = false,
  onDismiss,
  onConfirm,
}: HelpRequestConfirmDialogProps) {
  const theme = useAppTheme();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={loading ? undefined : onDismiss}>
        <Dialog.Title style={typography.sectionTitle}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={[typography.body, { color: theme.colors.onSurfaceVariant }]}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss} disabled={loading}>
            {assistanceStrings.lifecycle.cancel}
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            buttonColor={destructive ? theme.colors.error : undefined}
            textColor={destructive ? theme.colors.onError : undefined}
          >
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 4 },
});
