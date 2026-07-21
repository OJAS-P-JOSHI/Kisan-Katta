import axios from 'axios';

import { strings } from '@/constants';
import type { ApiErrorResponse } from '@/types';

const MARKET_ERROR_MESSAGES = {
  timeout: 'Request timed out. Mandi prices can take longer to load — please try again.',
  network: 'Network error. Please check your connection and try again.',
  backendUnavailable: 'Market prices are temporarily unavailable. Please try again later.',
} as const;

/** Maps market API errors to user-facing messages (timeout, network, backend, generic). */
export const getMarketErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return MARKET_ERROR_MESSAGES.timeout;
    }
    if (!error.response) {
      return MARKET_ERROR_MESSAGES.network;
    }
    if (error.response.status >= 500) {
      return MARKET_ERROR_MESSAGES.backendUnavailable;
    }
    return error.response.data?.message || strings.market.errorMessage;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return strings.market.errorMessage;
};
