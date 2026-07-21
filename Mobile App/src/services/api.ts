import axios, { type AxiosInstance } from 'axios';

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config/environment';

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

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
);
