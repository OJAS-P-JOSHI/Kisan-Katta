import { Schema, model } from "mongoose";
import { DEFAULT_USER_ROLE, USER_ROLES } from "./auth.constants";
import type { UserRole } from "./auth.constants";

// auth_users stores authentication data and platform role.
// District, village, crops, language belong to farmer_profiles.
interface IAuthUser {
  mobile: string;         // E.164 format: +919876543210
  role: UserRole;
  isProfileCompleted: boolean;
  isVerified: boolean;    // true after the first successful OTP verification
  lastLoginAt: Date | null; // updated on every successful OTP verification
  createdAt: Date;
  updatedAt: Date;
}

const AuthUserSchema = new Schema<IAuthUser>(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: DEFAULT_USER_ROLE,
      index: true,
    },
    isProfileCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "auth_users",
  }
);

export type { IAuthUser };
export const AuthUser = model<IAuthUser>("AuthUser", AuthUserSchema);
