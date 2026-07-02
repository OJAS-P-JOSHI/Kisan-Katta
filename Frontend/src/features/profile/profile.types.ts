import type { ID } from '@/types';

export type UserRole = 'farmer' | 'buyer' | 'trader';

export type UserProfile = {
  id: ID;
  name: string;
  phone: string;
  location: string;
  role: UserRole;
};
