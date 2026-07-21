import { useMutation } from '@tanstack/react-query'

import { sendOtp, verifyOtp } from '@/api/auth.api'
import type { SendOtpResponse, VerifyOtpResponse } from '@/types/auth.types'

/**
 * TanStack Query mutation for requesting an OTP. Mirrors the mobile app's
 * `useSendOtp` (loading + error state), but uses React Query on the web.
 */
export function useSendOtp() {
  return useMutation<SendOtpResponse, unknown, string>({
    mutationFn: (mobile: string) => sendOtp(mobile),
  })
}

/** TanStack Query mutation for verifying an OTP. Mirrors mobile's `useVerifyOtp`. */
export function useVerifyOtp() {
  return useMutation<VerifyOtpResponse, unknown, { mobile: string; otp: string }>({
    mutationFn: ({ mobile, otp }) => verifyOtp(mobile, otp),
  })
}
