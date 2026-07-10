import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { marketplaceStrings } from '../marketplace.strings';
import type { LifecycleDialog } from '../hooks/useListingLifecycleActions';

type ListingLifecycleDialogsProps = {
  dialog: LifecycleDialog;
  loading: boolean;
  onDismiss: () => void;
  onConfirmMarkSold: () => void;
  onConfirmArchive: () => void;
};

export function ListingLifecycleDialogs({
  dialog,
  loading,
  onDismiss,
  onConfirmMarkSold,
  onConfirmArchive,
}: ListingLifecycleDialogsProps) {
  return (
    <Portal>
      <Dialog visible={dialog === 'sold'} onDismiss={onDismiss}>
        <Dialog.Title>{marketplaceStrings.lifecycle.markSoldTitle}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{marketplaceStrings.lifecycle.markSoldMessage}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            {marketplaceStrings.lifecycle.cancel}
          </Button>
          <Button onPress={onConfirmMarkSold} loading={loading} disabled={loading}>
            {marketplaceStrings.lifecycle.markSoldConfirm}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={dialog === 'archive'} onDismiss={onDismiss}>
        <Dialog.Title>{marketplaceStrings.lifecycle.archiveTitle}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{marketplaceStrings.lifecycle.archiveMessage}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            {marketplaceStrings.lifecycle.cancel}
          </Button>
          <Button onPress={onConfirmArchive} loading={loading} disabled={loading}>
            {marketplaceStrings.lifecycle.archiveConfirm}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
