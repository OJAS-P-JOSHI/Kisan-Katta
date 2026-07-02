import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { createProfile } from '../profile.service';
import type { CreateProfileBody, ProfileResponseDTO } from '../profile.types';

export type UseSaveProfileReturn = {
  saving: boolean;
  error: string | null;
  saveProfile: (body: CreateProfileBody) => Promise<ProfileResponseDTO | null>;
};

/** POST /api/v1/profile — used by the Complete Profile screen. */
export function useSaveProfile(): UseSaveProfileReturn {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = useCallback(async (body: CreateProfileBody): Promise<ProfileResponseDTO | null> => {
    setSaving(true);
    setError(null);
    try {
      return await createProfile(body);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save your profile. Please try again.'));
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, error, saveProfile };
}
