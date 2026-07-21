import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { updateMyProfile } from '../profile.service';
import type { ProfileResponseDTO, UpdateProfileBody } from '../profile.types';

export type UseUpdateProfileReturn = {
  updating: boolean;
  error: string | null;
  updateProfile: (body: UpdateProfileBody) => Promise<ProfileResponseDTO | null>;
};

/** PUT /api/v1/profile/me — used by the Edit Profile screen. */
export function useUpdateProfile(): UseUpdateProfileReturn {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (body: UpdateProfileBody): Promise<ProfileResponseDTO | null> => {
    setUpdating(true);
    setError(null);
    try {
      return await updateMyProfile(body);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update your profile. Please try again.'));
      return null;
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updating, error, updateProfile };
}
