import axios from 'axios';

import { strings } from '@/constants';
import type { ApiErrorResponse } from '@/types';

/** Maps market API errors to user-facing messages (timeout, network, backend, generic). */
export const getMarketErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return strings.market.errorTimeout;
    }
    if (!error.response) {
      return strings.market.errorNetwork;
    }
    if (error.response.status >= 500) {
      return strings.market.errorBackendUnavailable;
    }
    return error.response.data?.message || strings.market.errorMessage;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return strings.market.errorMessage;
};
