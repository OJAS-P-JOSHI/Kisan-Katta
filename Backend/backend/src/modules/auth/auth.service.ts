import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
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

  const token = signToken({
    userId: user._id.toString(),
    mobile: user.mobile,
  });

  return {
    token,
    isNewUser,
    isProfileCompleted: user.isProfileCompleted,
  };
};

/** Returns the authenticated user's auth record. */
export const getMe = async (userId: string): Promise<MeResponseDTO> => {
  const user = await AuthUser.findById(userId);
  if (!user) {
    throw new AppError("Authenticated user not found.", 401);
  }

  return {
    userId: user._id.toString(),
    mobile: user.mobile,
    isProfileCompleted: user.isProfileCompleted,
    createdAt: user.createdAt,
  };
};
