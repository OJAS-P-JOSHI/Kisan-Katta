import { useCallback, useState } from 'react';

import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { archiveListing, updateListing } from '../marketplace.service';
import { marketplaceStrings } from '../marketplace.strings';

export type LifecycleDialog = 'sold' | 'archive' | null;

type UseListingLifecycleActionsOptions = {
  onMarkedSold?: () => void | Promise<void>;
  onArchived?: () => void | Promise<void>;
};

/** Shared mark-sold / archive flow with confirmation and loading guard. */
export function useListingLifecycleActions(options: UseListingLifecycleActionsOptions = {}) {
  const { onMarkedSold, onArchived } = options;
  const [dialog, setDialog] = useState<LifecycleDialog>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openMarkSoldDialog = useCallback((listingId: string) => {
    setPendingId(listingId);
    setDialog('sold');
  }, []);

  const openArchiveDialog = useCallback((listingId: string) => {
    setPendingId(listingId);
    setDialog('archive');
  }, []);

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
      return marketplaceStrings.lifecycle.markedSold;
    } catch (err) {
      return marketplaceStrings.lifecycle.unableMarkSold;
    } finally {
      setLoading(false);
    }
  }, [loading, onMarkedSold, pendingId]);

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
    openMarkSoldDialog,
    openArchiveDialog,
    closeDialog,
    confirmMarkSold,
    confirmArchive,
  };
}
