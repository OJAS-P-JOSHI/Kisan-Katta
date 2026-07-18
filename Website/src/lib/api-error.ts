import axios from 'axios'

import type { ApiErrorResponse } from '@/types/auth.types'

/**
 * Extracts a user-facing message from an API error, replicated from the mobile
 * app's `getErrorMessage` (`Frontend/src/utils/index.ts`). It surfaces the
 * backend's `{ success: false, message }` envelope, with graceful fallbacks for
 * network and unexpected errors.
 */
export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.'
    }
    return error.response.data?.message || fallback
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** True when the error represents an HTTP 401 (unauthenticated / expired session). */
export const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401
