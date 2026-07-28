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
// LGD location shapes (response + optional request codes)
// ---------------------------------------------------------------------------

export interface ProfileDistrictDTO {
  code: number | null;
  name: string;
}

export interface ProfileTalukaDTO {
  code: number | null;
  name: string;
}

export interface ProfileVillageDTO {
  code: number | null;
  name: string;
  nameMr: string | null;
}

/** Structured LGD location embedded in profile responses. */
export interface ProfileLocationDTO {
  district: ProfileDistrictDTO;
  taluka: ProfileTalukaDTO;
  village: ProfileVillageDTO;
}

// ---------------------------------------------------------------------------
// Mongoose document interface
//
// Flat name strings remain the source of truth for internal modules
// (marketplace, market, farmer-price). Optional LGD codes are filled on
// create/update when the hierarchy resolves against the Location Master.
// Legacy documents may have null codes until the farmer updates location.
// ---------------------------------------------------------------------------

export interface IFarmerProfile {
  userId: Types.ObjectId;
  name: string;
  /** Canonical LGD district name (string for legacy internal consumers). */
  district: string;
  taluka: string;
  village: string;
  /** LGD district code — null on legacy profiles. */
  districtCode?: number | null;
  /** LGD taluka code — null on legacy profiles. */
  talukaCode?: number | null;
  /** LGD village code — null on legacy profiles. */
  villageCode?: number | null;
  /** Marathi village name from LGD — null on legacy profiles. */
  villageNameMr?: string | null;
  favoriteCrops: string[];
  language: SupportedLanguage;
  /** Missing on legacy docs; treat as null in DTOs. */
  profileImage?: ProfileImage | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Request body shapes
//
// New clients may send *Code fields. Legacy clients (mobile) send only names.
// Codes win when both are present for the same level.
// ---------------------------------------------------------------------------

export interface CreateProfileBody {
  name: string;
  favoriteCrops: string[];
  language: SupportedLanguage;
  district?: string;
  taluka?: string;
  village?: string;
  districtCode?: number;
  talukaCode?: number;
  villageCode?: number;
}

export interface UpdateProfileBody {
  name?: string;
  favoriteCrops?: string[];
  language?: SupportedLanguage;
  district?: string;
  taluka?: string;
  village?: string;
  districtCode?: number;
  talukaCode?: number;
  villageCode?: number;
}

// ---------------------------------------------------------------------------
// Response DTO
//
// Flat district/taluka/village strings are preserved for existing mobile
// clients. `location` carries the structured LGD objects (codes + names).
// ---------------------------------------------------------------------------

export interface ProfileResponseDTO {
  userId: string;
  name: string;
  /** Legacy flat district name string. */
  district: string;
  /** Legacy flat taluka name string. */
  taluka: string;
  /** Legacy flat village name string. */
  village: string;
  /** Structured LGD location (preferred for new clients). */
  location: ProfileLocationDTO;
  favoriteCrops: string[];
  language: SupportedLanguage;
  profileImage: ProfileImage | null;
  createdAt: Date;
  updatedAt: Date;
}
