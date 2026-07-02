import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type { CreateProfileBody, ProfileResponseDTO, UpdateProfileBody } from './profile.types';

const ENDPOINTS = {
  base: '/api/v1/profile',
  me: '/api/v1/profile/me',
} as const;

/** POST /api/v1/profile — creates the farmer's profile; marks `isProfileCompleted = true`. */
export const createProfile = async (body: CreateProfileBody): Promise<ProfileResponseDTO> => {
  const { data } = await api.post<ApiSuccessResponse<ProfileResponseDTO>>(ENDPOINTS.base, body);
  return data.data;
};

/** GET /api/v1/profile/me */
export const getMyProfile = async (): Promise<ProfileResponseDTO> => {
  const { data } = await api.get<ApiSuccessResponse<ProfileResponseDTO>>(ENDPOINTS.me);
  return data.data;
};

/** PUT /api/v1/profile/me — partial update, at least one field required. */
export const updateMyProfile = async (body: UpdateProfileBody): Promise<ProfileResponseDTO> => {
  const { data } = await api.put<ApiSuccessResponse<ProfileResponseDTO>>(ENDPOINTS.me, body);
  return data.data;
};
