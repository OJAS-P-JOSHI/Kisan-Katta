import { CLOUDINARY_PROFILE_FOLDER } from "./profile.constants";
import type { ProfileImage } from "./profile.types";

export const isProfilePublicId = (publicId: string): boolean =>
  publicId.startsWith(`${CLOUDINARY_PROFILE_FOLDER}/`);

export const toStoredProfileImage = (image: ProfileImage): ProfileImage => ({
  url: image.url,
  publicId: image.publicId,
});
