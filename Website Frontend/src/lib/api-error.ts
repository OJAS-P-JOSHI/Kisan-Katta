import axios from 'axios'

import type { ApiErrorResponse } from '@/types/auth.types'

/**
 * Extracts a user-facing message from an API error. Surfaces the backend's
 * `{ success: false, message }` envelope, with status-aware fallbacks for
 * network and unexpected errors.
 */
const STATUS_FALLBACKS: Record<number, string> = {
  400: 'Some details look invalid. Please review and try again.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'We could not find your application.',
  409: 'This action conflicts with the current application state. Please refresh.',
  500: 'Something went wrong on our side. Please try again shortly.',
}

export const getErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.'
    }
    const status = error.response.status
    return (
      error.response.data?.message ||
      STATUS_FALLBACKS[status] ||
      fallback
    )
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** True when the error represents an HTTP 401 (unauthenticated / expired session). */
export const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401
