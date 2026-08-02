import axios from 'axios';

import type { ApiErrorResponse } from '@/types';

import { assistanceStrings } from './assistance.strings';

const ASSISTANCE_ERROR_MESSAGES = {
  timeout: assistanceStrings.errors.timeout,
  network: assistanceStrings.errors.network,
  backendUnavailable: assistanceStrings.errors.backendUnavailable,
  validation: assistanceStrings.errors.validation,
} as const;

const localizeKnownServerMessage = (message: string | undefined): string | null => {
  if (!message) return null;
  const lower = message.toLowerCase();

  if (lower.includes('two active help requests') || lower.includes('active help request')) {
    return assistanceStrings.errors.activeLimit;
  }
  if (lower.includes('only verified') || lower.includes('verify your account')) {
    return assistanceStrings.errors.notVerified;
  }
  if (lower.includes('only open help requests can be supported')) {
    return assistanceStrings.support.notOpen;
  }
  if (lower.includes('already supported')) {
    return assistanceStrings.support.alreadySupported;
  }
  if (lower.includes('already reported')) {
    return assistanceStrings.report.alreadyReported;
  }
  if (lower.includes('cannot support your own')) {
    return assistanceStrings.support.ownRequest;
  }
  if (lower.includes('cannot report your own')) {
    return assistanceStrings.report.ownRequest;
  }
  if (lower.includes('too many')) {
    return assistanceStrings.errors.rateLimited;
  }
  if (lower.includes('pending review or open can be edited') || lower.includes('cannot be edited')) {
    return assistanceStrings.errors.cannotEdit;
  }

  return null;
};

/** Maps assistance API errors to user-facing Marathi messages. */
export const getAssistanceErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.code === 'ECONNABORTED') {
      return ASSISTANCE_ERROR_MESSAGES.timeout;
    }
    if (!error.response) {
      return ASSISTANCE_ERROR_MESSAGES.network;
    }

    const status = error.response.status;
    const serverMessage = error.response.data?.message;
    const localized = localizeKnownServerMessage(serverMessage);

    if (status === 429) {
      return localized ?? assistanceStrings.errors.rateLimited;
    }
    if (status >= 500) {
      return ASSISTANCE_ERROR_MESSAGES.backendUnavailable;
    }
    if (status === 409) {
      return localized ?? assistanceStrings.errors.activeLimit;
    }
    if (status === 403) {
      return localized ?? assistanceStrings.errors.notVerified;
    }
    if (status === 400) {
      return localized ?? serverMessage ?? ASSISTANCE_ERROR_MESSAGES.validation;
    }
    return localized ?? serverMessage ?? assistanceStrings.errors.generic;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return assistanceStrings.errors.generic;
};

/** True when the server rejected the action because a duplicate already exists. */
export const isConflictError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 409;
