import type { SupportedLanguage } from '@/constants';

/**
 * Profile domain DTOs that exactly mirror the backend responses
 * (`Backend/backend/src/modules/profile/profile.types.ts`). Note the backend
 * uses the US spelling `favoriteCrops`.
 */

export type ProfileImage = {
  url: string;
  publicId: string;
};

export type CreateProfileBody = {
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
};

export type UpdateProfileBody = Partial<CreateProfileBody>;

/** POST /api/v1/profile/image */
export type UploadProfileImageResponseDTO = {
  profileImage: ProfileImage;
};

/** POST /api/v1/profile, GET /api/v1/profile/me, PUT /api/v1/profile/me */
export type ProfileResponseDTO = {
  userId: string;
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
  profileImage: ProfileImage | null;
  createdAt: string;
  updatedAt: string;
};
