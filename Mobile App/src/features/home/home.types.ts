import type { ID } from '@/types';

export type HomeSummary = {
  id: ID;
  activeListings: number;
  unreadMessages: number;
  weatherSummary: string;
};
