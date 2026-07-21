import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type { AuthUser, SendOtpResponse, VerifyOtpResponse } from '../types/auth.types';

const ENDPOINTS = {
  sendOtp: '/api/v1/auth/send-otp',
  verifyOtp: '/api/v1/auth/verify-otp',
  me: '/api/v1/auth/me',
} as const;

/** POST /api/v1/auth/send-otp — backend normalizes/validates the mobile number. */
export const sendOtp = async (mobile: string): Promise<SendOtpResponse> => {
  const { data } = await api.post<ApiSuccessResponse<SendOtpResponse>>(ENDPOINTS.sendOtp, { mobile });
  return data.data;
};

/** POST /api/v1/auth/verify-otp */
export const verifyOtp = async (mobile: string, otp: string): Promise<VerifyOtpResponse> => {
  const { data } = await api.post<ApiSuccessResponse<VerifyOtpResponse>>(ENDPOINTS.verifyOtp, {
    mobile,
    otp,
  });
  return data.data;
};

/** GET /api/v1/auth/me — requires `Authorization: Bearer <token>` (set by AuthContext). */
export const getMe = async (): Promise<AuthUser> => {
  const { data } = await api.get<ApiSuccessResponse<AuthUser>>(ENDPOINTS.me);
  return data.data;
};
