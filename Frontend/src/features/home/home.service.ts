import { sleep } from '@/utils';

import { mockHomeSummary } from './home.mock';
import type { HomeSummary } from './home.types';

/**
 * Fetches the home dashboard summary.
 * Returns mock data for now; swap to the `api` client when the endpoint exists.
 */
export const getHomeSummary = async (): Promise<HomeSummary> => {
  await sleep(300);
  return mockHomeSummary;
};
