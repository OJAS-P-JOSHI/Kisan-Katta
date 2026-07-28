import { Types } from "mongoose";
import type { HydratedDocument } from "mongoose";
import { AppError } from "../../utils/AppError";
import {
  resolveLocationHierarchy,
  type ResolvedLocation,
} from "../location";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "./profile.model";
import type {
  CreateProfileBody,
  IFarmerProfile,
  ProfileLocationDTO,
  ProfileResponseDTO,
  UpdateProfileBody,
} from "./profile.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const hasDistrict = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.districtCode !== undefined ||
  (typeof body.district === "string" && body.district.length > 0);

const hasTaluka = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.talukaCode !== undefined ||
  (typeof body.taluka === "string" && body.taluka.length > 0);

const hasVillage = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.villageCode !== undefined ||
  (typeof body.village === "string" && body.village.length > 0);

const hasAnyLocationField = (
  body: CreateProfileBody | UpdateProfileBody
): boolean => hasDistrict(body) || hasTaluka(body) || hasVillage(body);

const toProfileImageDTO = (
  value: IFarmerProfile["profileImage"]
): ProfileResponseDTO["profileImage"] => {
  if (
    value &&
    typeof value.url === "string" &&
    value.url.length > 0 &&
    typeof value.publicId === "string" &&
    value.publicId.length > 0
  ) {
    return { url: value.url, publicId: value.publicId };
  }

  return null;
};

const toNullableNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

/** Builds the structured LGD block from stored flat fields + optional codes. */
const toLocationDTO = (doc: IFarmerProfile): ProfileLocationDTO => ({
  district: {
    code: toNullableNumber(doc.districtCode),
    name: doc.district,
  },
  taluka: {
    code: toNullableNumber(doc.talukaCode),
    name: doc.taluka,
  },
  village: {
    code: toNullableNumber(doc.villageCode),
    name: doc.village,
    nameMr: toNullableString(doc.villageNameMr),
  },
});

const toProfileDTO = (doc: HydratedDocument<IFarmerProfile>): ProfileResponseDTO => ({
  userId: doc.userId.toString(),
  name: doc.name,
  district: doc.district,
  taluka: doc.taluka,
  village: doc.village,
  location: toLocationDTO(doc),
  favoriteCrops: doc.favoriteCrops,
  language: doc.language,
  profileImage: toProfileImageDTO(doc.profileImage),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const locationFieldsFromResolved = (
  resolved: ResolvedLocation
): Pick<
  IFarmerProfile,
  | "district"
  | "taluka"
  | "village"
  | "districtCode"
  | "talukaCode"
  | "villageCode"
  | "villageNameMr"
> => ({
  district: resolved.district.name,
  taluka: resolved.taluka.name,
  village: resolved.village.name,
  districtCode: resolved.district.code,
  talukaCode: resolved.taluka.code,
  villageCode: resolved.village.code,
  villageNameMr: resolved.village.nameMr,
});

const resolveFromBody = (
  body: CreateProfileBody | UpdateProfileBody
): ResolvedLocation =>
  resolveLocationHierarchy({
    districtCode: body.districtCode,
    talukaCode: body.talukaCode,
    villageCode: body.villageCode,
    districtName: body.district,
    talukaName: body.taluka,
    villageName: body.village,
  });

/**
 * For updates: merge incoming location fields with the existing profile so a
 * partial location payload can still be validated as a full hierarchy.
 *
 * Changing district (name or code) without supplying a matching taluka and
 * village is rejected — mismatched hierarchy is never allowed.
 */
const resolveLocationForUpdate = (
  existing: IFarmerProfile,
  body: UpdateProfileBody
): ResolvedLocation => {
  const districtChanging =
    body.districtCode !== undefined || body.district !== undefined;
  const talukaChanging =
    body.talukaCode !== undefined || body.taluka !== undefined;
  const villageChanging =
    body.villageCode !== undefined || body.village !== undefined;

  if (districtChanging && (!talukaChanging || !villageChanging)) {
    throw new AppError(
      "Changing district requires a matching taluka and village.",
      400
    );
  }

  if (talukaChanging && !villageChanging && !districtChanging) {
    // Taluka change without village — still need a village that belongs to the
    // new taluka. Require explicit village on taluka change.
    throw new AppError(
      "Changing taluka requires a matching village.",
      400
    );
  }

  return resolveLocationHierarchy({
    districtCode:
      body.districtCode ??
      (body.district !== undefined
        ? undefined
        : toNullableNumber(existing.districtCode) ?? undefined),
    talukaCode:
      body.talukaCode ??
      (body.taluka !== undefined
        ? undefined
        : toNullableNumber(existing.talukaCode) ?? undefined),
    villageCode:
      body.villageCode ??
      (body.village !== undefined
        ? undefined
        : toNullableNumber(existing.villageCode) ?? undefined),
    districtName:
      body.district ??
      (body.districtCode !== undefined ? undefined : existing.district),
    talukaName:
      body.taluka ??
      (body.talukaCode !== undefined ? undefined : existing.taluka),
    villageName:
      body.village ??
      (body.villageCode !== undefined ? undefined : existing.village),
  });
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Creates a farmer profile for the authenticated user.
 * Validates District → Taluka → Village against the LGD Location Master,
 * stores canonical names + codes, then marks auth_users.isProfileCompleted.
 * Throws 409 if the profile already exists.
 */
export const createProfile = async (
  userId: string,
  data: CreateProfileBody
): Promise<ProfileResponseDTO> => {
  const existingProfile = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (existingProfile) {
    throw new AppError(
      "Profile already exists. Use PUT /api/v1/profile/me to update it.",
      409
    );
  }

  const resolved = resolveFromBody(data);
  const locationFields = locationFieldsFromResolved(resolved);

  const profile = await FarmerProfile.create({
    userId: new Types.ObjectId(userId),
    name: data.name,
    ...locationFields,
    favoriteCrops: data.favoriteCrops,
    language: data.language,
  });

  await AuthUser.findByIdAndUpdate(userId, { isProfileCompleted: true });

  return toProfileDTO(profile);
};

/** Returns the authenticated farmer's profile. */
export const getProfile = async (userId: string): Promise<ProfileResponseDTO> => {
  const profile = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!profile) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  return toProfileDTO(profile);
};

/**
 * Updates the authenticated farmer's profile.
 * Location fields are re-validated as a full District → Taluka → Village
 * hierarchy whenever any location field is present.
 */
export const updateProfile = async (
  userId: string,
  inputData: UpdateProfileBody
): Promise<ProfileResponseDTO> => {
  const existing = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });

  if (!existing) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  const $set: Record<string, unknown> = {};

  if (inputData.name !== undefined) $set.name = inputData.name;
  if (inputData.favoriteCrops !== undefined) {
    $set.favoriteCrops = inputData.favoriteCrops;
  }
  if (inputData.language !== undefined) $set.language = inputData.language;

  if (hasAnyLocationField(inputData)) {
    const resolved = resolveLocationForUpdate(existing, inputData);
    Object.assign($set, locationFieldsFromResolved(resolved));
  }

  const profile = await FarmerProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  return toProfileDTO(profile);
};
