import { useCallback, useEffect, useState } from 'react';

import { MAX_ACTIVE_HELP_REQUESTS } from '../assistance.constants';
import { getAssistanceErrorMessage } from '../assistance.errors';
import { getMyAssistanceSummary } from '../assistance.service';
import type { MyAssistanceSummary } from '../assistance.types';

const EMPTY_SUMMARY: MyAssistanceSummary = {
  pendingReview: 0,
  open: 0,
  resolved: 0,
  rejected: 0,
  archived: 0,
  activeCount: 0,
  maxActive: MAX_ACTIVE_HELP_REQUESTS,
  // Fail closed — never open the create form until the server confirms capacity.
  canCreate: false,
};

export type UseMyAssistanceSummaryReturn = {
  data: MyAssistanceSummary;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Loads the author's status counts from GET /assistance/my-summary. The server
 * owns `canCreate`; the client never derives the active-request gate itself.
 *
 * `refresh` does not flip `loading` again so focus syncs never flash the screen.
 */
export function useMyAssistanceSummary(): UseMyAssistanceSummaryReturn {
  const [data, setData] = useState<MyAssistanceSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const summary = await getMyAssistanceSummary();
      setData(summary);
    } catch (err) {
      setError(getAssistanceErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        const summary = await getMyAssistanceSummary();
        if (!cancelled) setData(summary);
      } catch (err) {
        if (!cancelled) setError(getAssistanceErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error, refresh };
}
