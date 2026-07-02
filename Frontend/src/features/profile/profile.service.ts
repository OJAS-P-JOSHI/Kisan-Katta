import { sleep } from '@/utils';

import { mockUserProfile } from './profile.mock';
import type { UserProfile } from './profile.types';

/**
 * Fetches the current user's profile.
 * Returns mock data for now; swap to the `api` client when the endpoint exists.
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  await sleep(300);
  return mockUserProfile;
};
