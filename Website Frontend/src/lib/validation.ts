import { z } from 'zod'

/**
 * Single source of truth for auth validation, replicated from the mobile app
 * (`Frontend/src/features/auth/screens/MobileNumberScreen.tsx` and
 * `OtpScreen.tsx`). Do not duplicate these values elsewhere.
 */

/** Exactly 10 digits — identical to the mobile app's `MOBILE_REGEX`. */
export const MOBILE_REGEX = /^\d{10}$/

/** Strips everything except digits (mirrors the mobile keystroke sanitizer). */
export const DIGITS_ONLY_REGEX = /[^0-9]/g

/** OTP length used by the backend and mobile app. */
export const OTP_LENGTH = 6

/** Resend cooldown in seconds — identical to the mobile app. */
export const RESEND_COOLDOWN_SECONDS = 30

/** Fixed country code shown in the UI. Only the 10 bare digits are sent. */
export const COUNTRY_CODE = '+91'

export const mobileSchema = z.object({
  mobile: z
    .string()
    .regex(MOBILE_REGEX, 'Please enter a valid 10-digit mobile number'),
})

export type MobileFormValues = z.infer<typeof mobileSchema>

export const otpSchema = z.object({
  otp: z
    .string()
    .length(OTP_LENGTH, 'Please enter the complete 6-digit OTP')
    .regex(/^\d+$/, 'OTP must contain digits only'),
})

export type OtpFormValues = z.infer<typeof otpSchema>

/** Keeps only digits and clamps to 10 chars — used on every mobile keystroke. */
export const sanitizeMobile = (value: string): string =>
  value.replace(DIGITS_ONLY_REGEX, '').slice(0, 10)

/** Keeps only digits and clamps to the OTP length. */
export const sanitizeOtp = (value: string): string =>
  value.replace(DIGITS_ONLY_REGEX, '').slice(0, OTP_LENGTH)
