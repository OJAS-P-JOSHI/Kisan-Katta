import type { AdminProfileDTO } from "../admin/admin.dto";
import type { UserRole } from "./auth.constants";

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------

/** Payload encoded inside every JWT. Keep minimal — no profile fields. */
export interface JwtPayload {
  userId: string;
  mobile: string;
}

// ---------------------------------------------------------------------------
// Request bodies
// ---------------------------------------------------------------------------

export interface SendOtpBody {
  mobile: string;
}

export interface VerifyOtpBody {
  mobile: string;
  otp: string;
}

// ---------------------------------------------------------------------------
// Response DTOs — never expose Mongoose documents directly.
// ---------------------------------------------------------------------------

export interface SendOtpResponseDTO {
  message: string;
  /** Returned only in development to aid testing without an SMS provider. */
  otp?: string;
}

export interface VerifyOtpResponseDTO {
  token: string;
  isNewUser: boolean;
  isProfileCompleted: boolean;
  role: UserRole;
  /** True when an active Admin portal record exists for this mobile. */
  isAdmin: boolean;
  admin: AdminProfileDTO | null;
}

export interface MeResponseDTO {
  userId: string;
  mobile: string;
  isProfileCompleted: boolean;
  createdAt: Date;
  role: UserRole;
  isAdmin: boolean;
  admin: AdminProfileDTO | null;
}
