import { IconButton, Menu } from 'react-native-paper';

import { marketplaceStrings } from '../marketplace.strings';
import type { MarketplaceListing } from '../marketplace.types';

type MyListingActionsMenuProps = {
  listing: MarketplaceListing;
  visible: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onDismiss: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onMarkSold: () => void;
  onArchive: () => void;
};

/** Overflow menu for My Listings card actions. Renew stays as a separate primary button. */
export function MyListingActionsMenu({
  listing,
  visible,
  disabled,
  onOpen,
  onDismiss,
  onEdit,
  onDuplicate,
  onMarkSold,
  onArchive,
}: MyListingActionsMenuProps) {
  const isLabour = listing.listingType === 'labour';
  const canEdit = listing.status !== 'ARCHIVED';
  const isActive = listing.status === 'ACTIVE';

  return (
    <Menu
      visible={visible}
      onDismiss={onDismiss}
      anchorPosition="bottom"
      anchor={
        <IconButton
          icon="dots-vertical"
          size={20}
          onPress={onOpen}
          disabled={disabled}
          accessibilityLabel={marketplaceStrings.myListings.moreA11y}
          style={{ margin: 0, marginRight: -8 }}
        />
      }
    >
      {canEdit ? (
        <Menu.Item
          leadingIcon="pencil-outline"
          onPress={() => {
            onDismiss();
            onEdit();
          }}
          title={marketplaceStrings.myListings.edit}
        />
      ) : null}
      <Menu.Item
        leadingIcon="content-copy"
        onPress={() => {
          onDismiss();
          onDuplicate();
        }}
        title={marketplaceStrings.myListings.duplicate}
      />
      {isActive ? (
        <>
          <Menu.Item
            leadingIcon="check-circle-outline"
            onPress={() => {
              onDismiss();
              onMarkSold();
            }}
            title={
              isLabour
                ? marketplaceStrings.myListings.markHired
                : marketplaceStrings.myListings.markSold
            }
          />
          <Menu.Item
            leadingIcon="archive-outline"
            onPress={() => {
              onDismiss();
              onArchive();
            }}
            title={marketplaceStrings.myListings.archive}
            titleStyle={{ color: '#BA1A1A' }}
          />
        </>
      ) : null}
    </Menu>
  );
}
