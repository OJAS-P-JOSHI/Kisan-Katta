/**
 * Central runtime configuration, mirroring the mobile app's
 * `src/config/environment.ts`. All values are read from Vite env vars so the
 * web client can point at the same backend as the mobile app.
 */

/** Base URL of the backend. Endpoints append the `/api/v1/...` prefix. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

/** Axios request timeout in milliseconds. */
export const REQUEST_TIMEOUT: number =
  Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000

/** Current environment. In `development` the backend echoes the OTP. */
export const APP_ENV: string = import.meta.env.VITE_APP_ENV ?? 'development'

/** Convenience flag used to surface the dev OTP in the UI. */
export const IS_DEV: boolean = APP_ENV === 'development'
