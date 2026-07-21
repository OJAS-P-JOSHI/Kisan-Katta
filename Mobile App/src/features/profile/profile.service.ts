import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type {
  CreateProfileBody,
  ProfileImage,
  ProfileResponseDTO,
  UpdateProfileBody,
  UploadProfileImageResponseDTO,
} from './profile.types';

const ENDPOINTS = {
  base: '/api/v1/profile',
  me: '/api/v1/profile/me',
  image: '/api/v1/profile/image',
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

/** POST /api/v1/profile/image — multipart field `image`. */
export const uploadProfileImage = async (
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<ProfileImage> => {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await api.post<ApiSuccessResponse<UploadProfileImageResponseDTO>>(
    ENDPOINTS.image,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (payload) => payload,
    },
  );

  return data.data.profileImage;
};

/** DELETE /api/v1/profile/image */
export const deleteProfileImage = async (): Promise<void> => {
  await api.delete<ApiSuccessResponse<null>>(ENDPOINTS.image);
};
