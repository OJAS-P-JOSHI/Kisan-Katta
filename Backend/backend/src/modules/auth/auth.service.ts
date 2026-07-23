import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import {
  lookupAdminForSession,
  resolveAdminAfterAuth,
} from "../admin/admin.service";
import { AuthUser } from "./auth.model";
import { generateOtp, consumeOtp } from "./otp.service";
import { signToken } from "./jwt.service";
import type {
  MeResponseDTO,
  SendOtpResponseDTO,
  VerifyOtpResponseDTO,
} from "./auth.types";

/**
 * Generates an OTP for the given mobile number.
 * In development the OTP is returned in the response to allow testing
 * without an SMS provider. In production only a success message is returned.
 */
export const sendOtp = (mobile: string): SendOtpResponseDTO => {
  const otp = generateOtp(mobile);

  if (env.nodeEnv === "development") {
    return { message: "OTP generated successfully.", otp };
  }

  return { message: "OTP sent to your mobile number." };
};

/**
 * Verifies the OTP, creates the auth_user if this is a new number,
 * and returns a signed JWT plus flags the client needs for routing.
 *
 * Admin authorization runs ONLY after OTP success — never trust the
 * phone number before verification.
 */
export const verifyOtpAndAuthenticate = async (
  mobile: string,
  otp: string
): Promise<VerifyOtpResponseDTO> => {
  const isValid = consumeOtp(mobile, otp);
  if (!isValid) {
    throw new AppError("Invalid or expired OTP. Please request a new one.", 400);
  }

  let user = await AuthUser.findOne({ mobile });
  let isNewUser = false;

  if (!user) {
    user = await AuthUser.create({
      mobile,
      isProfileCompleted: false,
      isVerified: true,
      lastLoginAt: new Date(),
    });
    isNewUser = true;
  } else {
    // Mark as verified and record the login time on every successful
    // OTP verification — covers both first-time and returning users.
    user.isVerified = true;
    user.lastLoginAt = new Date();
    await user.save();
  }

  // Portal admin lookup — post-OTP only. Syncs AuthUser.role for legacy
  // requireAdmin middleware compatibility without a separate login system.
  const admin = await resolveAdminAfterAuth(user._id.toString(), user.mobile);
  if (admin) {
    if (user.role !== "ADMIN") {
      user.role = "ADMIN";
      await user.save();
    }
  }

  const token = signToken({
    userId: user._id.toString(),
    mobile: user.mobile,
  });

  return {
    token,
    isNewUser,
    isProfileCompleted: user.isProfileCompleted,
    role: user.role,
    isAdmin: Boolean(admin),
    admin: admin ?? null,
  };
};

/** Returns the authenticated user's auth record (+ admin portal profile when applicable). */
export const getMe = async (userId: string): Promise<MeResponseDTO> => {
  const user = await AuthUser.findById(userId);
  if (!user) {
    throw new AppError("Authenticated user not found.", 401);
  }

  const admin = await lookupAdminForSession(
    user._id.toString(),
    user.mobile
  );
  if (admin && user.role !== "ADMIN") {
    user.role = "ADMIN";
    await user.save();
  }

  return {
    userId: user._id.toString(),
    mobile: user.mobile,
    isProfileCompleted: user.isProfileCompleted,
    createdAt: user.createdAt,
    role: user.role,
    isAdmin: Boolean(admin),
    admin: admin ?? null,
  };
};
