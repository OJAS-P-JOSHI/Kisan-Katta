/**
 * Cloudinary delivery helpers for display-time transforms.
 * Stored URLs stay untouched in MongoDB; we only reshape for the Image component.
 */

const UPLOAD_SEGMENT = '/upload/';

/** True when the URL is a Cloudinary image delivery URL. */
export const isCloudinaryImageUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname.endsWith('res.cloudinary.com') &&
      parsed.pathname.includes(UPLOAD_SEGMENT)
    );
  } catch {
    return false;
  }
};

/**
 * Inserts `c_limit,w_*,f_auto,q_auto` after `/upload/` so phones load a
 * reasonably sized derivative instead of a multi‑megabyte original.
 * Idempotent — already-transformed URLs are returned unchanged.
 */
export const buildCloudinaryDisplayUrl = (
  url: string,
  width = 1200,
): string => {
  if (!isCloudinaryImageUrl(url)) return url;

  const markerIndex = url.indexOf(UPLOAD_SEGMENT);
  if (markerIndex === -1) return url;

  const afterUpload = url.slice(markerIndex + UPLOAD_SEGMENT.length);
  if (
    afterUpload.startsWith('c_limit') ||
    afterUpload.startsWith('f_auto') ||
    afterUpload.startsWith('q_auto') ||
    afterUpload.startsWith('w_')
  ) {
    return url;
  }

  return (
    url.slice(0, markerIndex + UPLOAD_SEGMENT.length) +
    `c_limit,w_${width},f_auto,q_auto/` +
    afterUpload
  );
};
