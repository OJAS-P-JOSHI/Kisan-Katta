import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "./profile.model";
import type { HydratedDocument } from "mongoose";
import type {
  CreateProfileBody,
  IFarmerProfile,
  ProfileResponseDTO,
  UpdateProfileBody,
} from "./profile.types";

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

const toProfileDTO = (doc: HydratedDocument<IFarmerProfile>): ProfileResponseDTO => ({
  userId: doc.userId.toString(),
  name: doc.name,
  district: doc.district,
  taluka: doc.taluka,
  village: doc.village,
  favoriteCrops: doc.favoriteCrops,
  language: doc.language,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Creates a farmer profile for the authenticated user.
 * Validates the district against the 36 Maharashtra districts, stores the
 * canonical name, then marks auth_users.isProfileCompleted = true.
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

  // resolveDistrict validates + returns the canonical display name
  const { district: canonicalDistrict } = resolveDistrict(data.district);

  const profile = await FarmerProfile.create({
    userId: new Types.ObjectId(userId),
    name: data.name,
    district: canonicalDistrict,
    taluka: data.taluka,
    village: data.village,
    favoriteCrops: data.favoriteCrops,
    language: data.language,
  });

  // Sync the completion flag on the auth record
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
 * Only provided fields are changed. District updates go through the canonical
 * district resolver to ensure consistent naming.
 */
export const updateProfile = async (
  userId: string,
  inputData: UpdateProfileBody
): Promise<ProfileResponseDTO> => {
  // Resolve district to its canonical name if it is being updated
  const updateData: UpdateProfileBody = { ...inputData };
  if (updateData.district) {
    const { district: canonicalDistrict } = resolveDistrict(updateData.district);
    updateData.district = canonicalDistrict;
  }

  const profile = await FarmerProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new AppError("Profile not found. Please create your profile first.", 404);
  }

  return toProfileDTO(profile);
};
