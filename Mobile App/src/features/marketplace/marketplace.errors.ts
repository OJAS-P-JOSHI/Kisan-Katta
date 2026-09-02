import { isAxiosError } from 'axios';

import type { ApiErrorResponse } from '@/types';

import { marketplaceStrings } from './marketplace.strings';

const MARKETPLACE_ERROR_MESSAGES = {
  timeout: marketplaceStrings.errors.timeout,
  network: marketplaceStrings.errors.network,
  backendUnavailable: marketplaceStrings.errors.backendUnavailable,
  validation: marketplaceStrings.errors.validation,
} as const;

/** Maps marketplace API errors to user-facing Marathi messages. Never returns raw backend text. */
export const getMarketplaceErrorMessage = (error: unknown): string => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return MARKETPLACE_ERROR_MESSAGES.timeout;
    }
    if (!error.response) {
      return MARKETPLACE_ERROR_MESSAGES.network;
    }
    if (error.response.status >= 500) {
      return MARKETPLACE_ERROR_MESSAGES.backendUnavailable;
    }
    if (error.response.status === 429) {
      return marketplaceStrings.errors.tooManyRequests;
    }
    if (error.response.status === 404) {
      return marketplaceStrings.errors.generic;
    }
    if (error.response.status === 409) {
      const message = error.response.data?.message ?? '';
      if (message.toLowerCase().includes('already reported')) {
        return marketplaceStrings.report.alreadyReported;
      }
      return marketplaceStrings.errors.generic;
    }
    if (error.response.status === 403) {
      const message = error.response.data?.message ?? '';
      if (message.toLowerCase().includes('renew')) {
        return marketplaceStrings.myListings.renewOwnOnly;
      }
      return marketplaceStrings.errors.generic;
    }
    if (error.response.status === 400) {
      const message = error.response.data?.message ?? '';
      const lower = message.toLowerCase();
      if (lower.includes('cannot report your own')) {
        return marketplaceStrings.report.ownListing;
      }
      if (lower.includes('cannot contact your own')) {
        return marketplaceStrings.errors.contactFailed;
      }
      if (lower.includes('sold listings cannot be renewed')) {
        return marketplaceStrings.myListings.renewSold;
      }
      if (lower.includes('archived listings cannot be renewed')) {
        return marketplaceStrings.myListings.renewArchived;
      }
      if (lower.includes('not eligible for renewal')) {
        return marketplaceStrings.myListings.renewNotEligible;
      }
      if (lower.includes('cannot be renewed')) {
        return marketplaceStrings.myListings.unableRenew;
      }
      return MARKETPLACE_ERROR_MESSAGES.validation;
    }
    return marketplaceStrings.errors.generic;
  }
  return marketplaceStrings.errors.generic;
};

/** Contact Call/WhatsApp feedback. Does not expose backend error details. */
export const getMarketplaceContactErrorMessage = (error: unknown): string => {
  const mapped = getMarketplaceErrorMessage(error);
  if (
    mapped === marketplaceStrings.errors.tooManyRequests ||
    mapped === marketplaceStrings.errors.network ||
    mapped === marketplaceStrings.errors.timeout
  ) {
    return mapped;
  }
  return marketplaceStrings.errors.contactFailed;
};
