import { Types } from "mongoose";

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

export const SUPPORTED_LANGUAGES = ["mr", "en", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// ---------------------------------------------------------------------------
// Profile image
// ---------------------------------------------------------------------------

export interface ProfileImage {
  url: string;
  publicId: string;
}

export interface UploadProfileImageResponseDTO {
  profileImage: ProfileImage;
}

// ---------------------------------------------------------------------------
// Mongoose document interface — no _id; Mongoose adds it automatically.
// ---------------------------------------------------------------------------

export interface IFarmerProfile {
  userId: Types.ObjectId;
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
  /** Missing on legacy docs; treat as null in DTOs. */
  profileImage?: ProfileImage | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Request body shapes
// ---------------------------------------------------------------------------

export interface CreateProfileBody {
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
}

export interface UpdateProfileBody {
  name?: string;
  district?: string;
  taluka?: string;
  village?: string;
  favoriteCrops?: string[];
  language?: SupportedLanguage;
}

// ---------------------------------------------------------------------------
// Response DTO — never expose Mongoose documents directly.
// ---------------------------------------------------------------------------

export interface ProfileResponseDTO {
  userId: string;
  name: string;
  district: string;
  taluka: string;
  village: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
  profileImage: ProfileImage | null;
  createdAt: Date;
  updatedAt: Date;
}
