import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import { API_BASE_URL, REQUEST_TIMEOUT } from '@/config/env'
import { tokenService } from '@/services/token.service'

/**
 * Single shared Axios instance. Every API call must import this client so base
 * URL, timeouts, and interceptors stay consistent. No `axios` usage inside
 * components. Mirrors `Frontend/src/services/api.ts`.
 *
 * IMPORTANT: We do NOT force a global `Content-Type`. Axios sets it per request
 * based on the body — `application/json` for plain objects and
 * `multipart/form-data; boundary=...` for `FormData`. Forcing JSON globally
 * would serialize `FormData` to JSON and break file uploads (`req.file` would
 * arrive undefined on the backend).
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
})

/**
 * Request interceptor — automatically attaches `Authorization: Bearer <token>`
 * from persistent storage on every request. On the web we read the token per
 * request (rather than the mobile app's `defaults.headers`) so a session
 * restored after a page refresh is picked up without extra wiring.
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenService.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

/**
 * Callback invoked when the server reports the session is no longer valid
 * (HTTP 401). Registered by the AuthProvider so the interceptor can trigger a
 * logout without importing React state directly.
 */
let onUnauthorized: (() => void) | null = null

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  onUnauthorized = handler
}

/**
 * Response interceptor — passes successful responses through and centralizes
 * 401 (expired/invalid session) handling by clearing the session.
 */
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)
