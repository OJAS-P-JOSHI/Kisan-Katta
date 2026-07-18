import { api } from '@/api/axios'
import type {
  ApiSuccessResponse,
  AuthUser,
  SendOtpResponse,
  VerifyOtpResponse,
} from '@/types/auth.types'

/**
 * Auth API functions — consume the existing backend endpoints exactly as the
 * mobile app does (`Frontend/src/features/auth/services/auth.service.ts`).
 * All calls go through the shared `api` instance; the Bearer token is attached
 * by the request interceptor.
 */
const ENDPOINTS = {
  sendOtp: '/api/v1/auth/send-otp',
  verifyOtp: '/api/v1/auth/verify-otp',
  me: '/api/v1/auth/me',
  logout: '/api/v1/auth/logout',
} as const

/** POST /api/v1/auth/send-otp — backend normalizes/validates the mobile number. */
export const sendOtp = async (mobile: string): Promise<SendOtpResponse> => {
  const { data } = await api.post<ApiSuccessResponse<SendOtpResponse>>(
    ENDPOINTS.sendOtp,
    { mobile },
  )
  return data.data
}

/** POST /api/v1/auth/verify-otp — returns the JWT and profile-completion flag. */
export const verifyOtp = async (
  mobile: string,
  otp: string,
): Promise<VerifyOtpResponse> => {
  const { data } = await api.post<ApiSuccessResponse<VerifyOtpResponse>>(
    ENDPOINTS.verifyOtp,
    { mobile, otp },
  )
  return data.data
}

/** GET /api/v1/auth/me — requires the Bearer token (attached by interceptor). */
export const getMe = async (): Promise<AuthUser> => {
  const { data } = await api.get<ApiSuccessResponse<AuthUser>>(ENDPOINTS.me)
  return data.data
}

/** POST /api/v1/auth/logout — stateless ack on the backend; safe to ignore errors. */
export const logoutRequest = async (): Promise<void> => {
  try {
    await api.post(ENDPOINTS.logout)
  } catch {
    // JWT is stateless; a failed logout call must not block local sign-out.
  }
}
