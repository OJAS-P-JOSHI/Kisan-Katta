/**
 * Farmer Assistance limits. These mirror
 * `Backend/backend/src/modules/assistance/assistance.constants.ts` — the server
 * stays the authority, the client only pre-validates for fast feedback.
 */

export const HELP_REQUEST_STATUSES = [
  'PENDING_REVIEW',
  'OPEN',
  'RESOLVED',
  'REJECTED',
  'ARCHIVED',
] as const;

export const PUBLIC_HELP_REQUEST_STATUSES = ['OPEN', 'RESOLVED'] as const;

export const EDITABLE_HELP_REQUEST_STATUSES = ['PENDING_REVIEW', 'OPEN'] as const;

export const HELP_REQUEST_SORT_OPTIONS = ['newest', 'most_supported'] as const;

export const REPORT_REASONS = [
  'SPAM',
  'FAKE_INFORMATION',
  'INAPPROPRIATE_IMAGES',
  'OTHER',
] as const;

export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MIN_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 3000;
export const REPORT_DETAILS_MAX_LENGTH = 300;

export const MIN_PROOF_PHOTOS = 1;
export const MAX_PROOF_PHOTOS = 3;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Proof photos are compressed by the image picker before upload so a phone
 * camera original never exceeds the 5 MB server limit.
 */
/** Match Marketplace pick quality closely while staying under the 5 MB server cap. */
export const IMAGE_COMPRESSION_QUALITY = 0.85;

/** Reject broken / QA 1×1 pixels and accidental icon-sized picks. */
export const MIN_PROOF_PHOTO_EDGE_PX = 64;

export const MAX_ACTIVE_HELP_REQUESTS = 2;

export const DEFAULT_PAGE = 1;
/** Match Marketplace browse page size and backend `DEFAULT_LIMIT`. */
export const DEFAULT_LIMIT = 20;

export const SEARCH_DEBOUNCE_MS = 300;

export const DESCRIPTION_PREVIEW_LINES = 3;

export const STATUS_FILTER_ALL = 'ALL' as const;

export type MyRequestsStatusFilter =
  | typeof STATUS_FILTER_ALL
  | (typeof HELP_REQUEST_STATUSES)[number];
