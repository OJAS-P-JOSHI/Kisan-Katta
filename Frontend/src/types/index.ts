/** Shared, cross-feature domain primitives. */

export type ID = string;

/** Standard envelope returned by the backend API. */
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

/** Discriminated result used by services that may fail gracefully. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
