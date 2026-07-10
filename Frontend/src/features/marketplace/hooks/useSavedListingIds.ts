import { useCallback, useEffect, useState } from 'react';

import { getMarketplaceErrorMessage } from '../marketplace.errors';
import { getSavedListings, saveListing, unsaveListing } from '../marketplace.service';

/** Tracks saved listing IDs and exposes optimistic save/unsave helpers. */
export function useSavedListingIds() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await getSavedListings(1, 100);
        if (!cancelled) {
          setSavedIds(new Set(result.listings.map((listing) => listing.id)));
        }
      } catch {
        // Saved state is optional for browse; ignore bootstrap failures.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleSave = useCallback(
    async (id: string): Promise<string | null> => {
      const wasSaved = savedIds.has(id);

      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(id);
        else next.add(id);
        return next;
      });

      try {
        if (wasSaved) await unsaveListing(id);
        else await saveListing(id);
        return null;
      } catch (err) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(id);
          else next.delete(id);
          return next;
        });
        return getMarketplaceErrorMessage(err);
      }
    },
    [savedIds],
  );

  return { savedIds, isSaved, toggleSave, loaded };
}
