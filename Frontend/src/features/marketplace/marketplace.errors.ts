import axios from 'axios';

import type { ApiErrorResponse } from '@/types';

import { marketplaceStrings } from './marketplace.strings';

const MARKETPLACE_ERROR_MESSAGES = {
  timeout: marketplaceStrings.errors.timeout,
  network: marketplaceStrings.errors.network,
  backendUnavailable: marketplaceStrings.errors.backendUnavailable,
  validation: marketplaceStrings.errors.validation,
} as const;

/** Maps marketplace API errors to user-facing messages. */
export const getMarketplaceErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return MARKETPLACE_ERROR_MESSAGES.timeout;
    }
    if (!error.response) {
      return MARKETPLACE_ERROR_MESSAGES.network;
    }
    if (error.response.status >= 500) {
      return MARKETPLACE_ERROR_MESSAGES.backendUnavailable;
    }
    if (error.response.status === 400) {
      return error.response.data?.message || MARKETPLACE_ERROR_MESSAGES.validation;
    }
    return error.response.data?.message || marketplaceStrings.errors.generic;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return marketplaceStrings.errors.generic;
};
