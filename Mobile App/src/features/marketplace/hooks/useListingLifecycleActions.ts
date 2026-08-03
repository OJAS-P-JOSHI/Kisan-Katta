import { useCallback, useState } from 'react';

import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { archiveListing, updateListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';
import type { ListingType } from '../marketplace.types';

export type LifecycleDialog = 'sold' | 'archive' | null;

type UseListingLifecycleActionsOptions = {
  listingType?: ListingType;
  onMarkedSold?: () => void | Promise<void>;
  onArchived?: () => void | Promise<void>;
};

/** Shared mark-sold / archive flow with confirmation and loading guard. */
export function useListingLifecycleActions(options: UseListingLifecycleActionsOptions = {}) {
  const { listingType: defaultListingType, onMarkedSold, onArchived } = options;
  const [dialog, setDialog] = useState<LifecycleDialog>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingListingType, setPendingListingType] = useState<ListingType | undefined>(
    defaultListingType,
  );
  const [loading, setLoading] = useState(false);
  const isLabour = (pendingListingType ?? defaultListingType) === 'labour';

  const openMarkSoldDialog = useCallback((listingId: string, listingType?: ListingType) => {
    setPendingId(listingId);
    setPendingListingType(listingType ?? defaultListingType);
    setDialog('sold');
  }, [defaultListingType]);

  const openArchiveDialog = useCallback((listingId: string, listingType?: ListingType) => {
    setPendingId(listingId);
    setPendingListingType(listingType ?? defaultListingType);
    setDialog('archive');
  }, [defaultListingType]);

  const closeDialog = useCallback(() => {
    if (loading) return;
    setDialog(null);
    setPendingId(null);
  }, [loading]);

  const confirmMarkSold = useCallback(async (): Promise<string | null> => {
    if (!pendingId || loading) return null;

    setLoading(true);
    try {
      await updateListing(pendingId, { status: 'SOLD' });
      await onMarkedSold?.();
      setDialog(null);
      setPendingId(null);
      return isLabour
        ? marketplaceStrings.lifecycle.markedHired
        : marketplaceStrings.lifecycle.markedSold;
    } catch {
      return isLabour
        ? marketplaceStrings.lifecycle.unableMarkHired
        : marketplaceStrings.lifecycle.unableMarkSold;
    } finally {
      setLoading(false);
    }
  }, [isLabour, loading, onMarkedSold, pendingId]);

  const confirmArchive = useCallback(async (): Promise<string | null> => {
    if (!pendingId || loading) return null;

    setLoading(true);
    try {
      await archiveListing(pendingId);
      await onArchived?.();
      setDialog(null);
      setPendingId(null);
      return marketplaceStrings.lifecycle.archived;
    } catch (err) {
      return getMarketplaceErrorMessage(err) || marketplaceStrings.lifecycle.unableArchive;
    } finally {
      setLoading(false);
    }
  }, [loading, onArchived, pendingId]);

  return {
    dialog,
    loading,
    isLabour,
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  };
}
