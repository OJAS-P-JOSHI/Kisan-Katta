import type { SupportedLanguage } from '@/constants';

import type { ProfileLocationBlock } from '@/features/location/location.types';

/**
 * Profile domain DTOs that mirror the backend
 * (`Backend/backend/src/modules/profile/profile.types.ts`).
 * Backend uses the US spelling `favoriteCrops`.
 */

export type ProfileImage = {
  url: string;
  publicId: string;
};

/**
 * Create / update body. Prefer LGD codes; names are sent for backwards
 * compatibility with older backend consumers.
 */
export type CreateProfileBody = {
  name: string;
  district: string;
  taluka: string;
  village: string;
  districtCode: number;
  talukaCode: number;
  villageCode: number;
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
  /** Legacy flat district name. */
  district: string;
  /** Legacy flat taluka name. */
  taluka: string;
  /** Legacy flat village name. */
  village: string;
  /**
   * Optional future Marathi flat names from backend.
   * Prefer `location.*.nameMr` when both exist.
   */
  districtNameMr?: string | null;
  talukaNameMr?: string | null;
  /** Structured LGD location — present on new backend responses. */
  location?: ProfileLocationBlock;
  favoriteCrops: string[];
  language: SupportedLanguage;
  profileImage: ProfileImage | null;
  createdAt: string;
  updatedAt: string;
};
