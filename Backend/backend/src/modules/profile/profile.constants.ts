export const MAX_PROFILE_IMAGES = 1;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CLOUDINARY_PROFILE_FOLDER = "kisan-katta/profile";

/** Longest edge for stored profile photos (Cloudinary `c_limit`). */
export const PROFILE_IMAGE_MAX_EDGE_PX = 800;
