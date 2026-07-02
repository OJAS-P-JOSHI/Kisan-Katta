import type { ID } from '@/types';

export type CommunityPost = {
  id: ID;
  authorName: string;
  content: string;
  likes: number;
  createdAt: string;
};
