/** Shared, cross-feature domain primitives. */

export type ID = string;

/** Standard envelope returned by the backend API. */
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

/**
 * Envelope shape returned by every Kisan Katta backend endpoint.
 * Success responses are `{ success: true, data: T }`; the global error
 * handler returns `{ success: false, message: string }` (see `getErrorMessage`
 * in `@/utils` for how errors are normalized into a display string).
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
};

/** Discriminated result used by services that may fail gracefully. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
