import { MAX_PROFILE_IMAGE_SIZE_BYTES } from './profile.constants';

export type ProfileImageSizeInput = {
  /** Bytes, when reported by the image picker. May be missing on some platforms. */
  fileSize?: number | null;
};

/**
 * Returns true when the selected image is within the 5 MB limit.
 * Missing / non-numeric `fileSize` is treated as unknown and allowed (no crash).
 * Exactly 5 MB is allowed; anything above is rejected.
 */
export function isProfileImageWithinSizeLimit(asset: ProfileImageSizeInput): boolean {
  const size = asset.fileSize;
  if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
    return true;
  }
  return size <= MAX_PROFILE_IMAGE_SIZE_BYTES;
}
