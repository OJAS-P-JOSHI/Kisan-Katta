import axios, { type AxiosInstance } from 'axios';

import { API_BASE_URL, APP_ENV, REQUEST_TIMEOUT } from '@/config/environment';

/**
 * Shared Axios instance. Feature services should import this client rather than
 * creating their own, so base URL, timeouts, and interceptors stay consistent.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// TEMPORARY — verify EAS-inlined env in the installed APK (remove after confirmed).
// eslint-disable-next-line no-console
console.log('[API ENV DEBUG]', {
  API_BASE_URL,
  APP_ENV,
  REQUEST_TIMEOUT,
  axiosBaseURL: api.defaults.baseURL ?? null,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);
