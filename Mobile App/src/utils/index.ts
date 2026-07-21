import axios from 'axios';

import type { ApiErrorResponse } from '@/types';

/** Small, dependency-free helpers shared across features. */

/** Resolves after `ms` milliseconds. Useful for simulating network latency in mocks. */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalizes any error thrown by an `api` (axios) call into a clean, user-facing
 * message. Every service should catch through this so screens never see raw
 * axios/network errors.
 */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.response.data?.message || fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

/** True when the error represents an HTTP 401 (unauthenticated / expired session). */
export const isUnauthorizedError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 401;
