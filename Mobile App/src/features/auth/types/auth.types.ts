/**
 * Auth domain DTOs that exactly mirror the backend responses
 * (`Backend/backend/src/modules/auth/auth.types.ts`). Never invent extra
 * fields here — components/hooks must consume exactly these shapes.
 */

export type SendOtpResponse = {
  message: string;
  /** Present only when `EXPO_PUBLIC_APP_ENV=development`. */
  otp?: string;
};

export type VerifyOtpResponse = {
  token: string;
  isNewUser: boolean;
  isProfileCompleted: boolean;
};

/** GET /api/v1/auth/me */
export type AuthUser = {
  userId: string;
  mobile: string;
  isProfileCompleted: boolean;
  createdAt: string;
};
