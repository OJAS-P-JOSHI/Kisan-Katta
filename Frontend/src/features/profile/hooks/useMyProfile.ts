import { useCallback, useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { getMyProfile } from '../profile.service';
import type { ProfileResponseDTO } from '../profile.types';

export type UseMyProfileReturn = {
  data: ProfileResponseDTO | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Fetches the authenticated farmer's profile via `GET /api/v1/profile/me`.
 * This is the single source of truth for farmer profile data — Home, the
 * Profile tab, and Edit Profile all call this hook rather than caching the
 * profile in a global context.
 */
export function useMyProfile(): UseMyProfileReturn {
  const [data, setData] = useState<ProfileResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setError(null);
    setLoading((wasLoading) => wasLoading || true);
    try {
      const profile = await getMyProfile();
      setData(profile);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load profile.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
