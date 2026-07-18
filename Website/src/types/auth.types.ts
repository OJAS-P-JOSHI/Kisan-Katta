/**
 * Auth DTOs — replicated verbatim from the mobile app
 * (`Frontend/src/features/auth/types/auth.types.ts`) and the backend
 * (`Backend/backend/src/modules/auth/auth.types.ts`). The website is just
 * another frontend client, so the contracts must match exactly.
 */

/** Standard success envelope used by every backend endpoint. */
export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

/** Standard error envelope used by the backend's global error handler. */
export type ApiErrorResponse = {
  success: false
  message: string
}

/** POST /api/v1/auth/send-otp */
export type SendOtpResponse = {
  message: string
  /** Present only when the backend runs in development. */
  otp?: string
}

/** POST /api/v1/auth/verify-otp */
export type VerifyOtpResponse = {
  token: string
  isNewUser: boolean
  isProfileCompleted: boolean
}

/**
 * Roles supported by the backend (`auth.constants.ts`). The `/auth/me`
 * endpoint does not currently return the role, so `AuthUser.role` is optional;
 * permissions must therefore never be hardcoded on the client.
 */
export const USER_ROLES = ['FARMER', 'GRAM_SAHAKARI', 'TEAM', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

/** GET /api/v1/auth/me */
export type AuthUser = {
  userId: string
  mobile: string
  isProfileCompleted: boolean
  createdAt: string
  /** Optional — only present if the backend includes it in the `/me` payload. */
  role?: UserRole
}
