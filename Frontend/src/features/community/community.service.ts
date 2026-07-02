import { sleep } from '@/utils';

import { mockCommunityPosts } from './community.mock';
import type { CommunityPost } from './community.types';

/**
 * Fetches community feed posts.
 * Returns mock data for now; swap to the `api` client when the endpoint exists.
 */
export const getCommunityPosts = async (): Promise<CommunityPost[]> => {
  await sleep(300);
  return mockCommunityPosts;
};
