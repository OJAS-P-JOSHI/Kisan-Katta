import { env } from "../../config/env";

interface OtpEntry {
  otp: string;
  expiresAt: number;
}

// Process-local OTP store.
// To switch to a persistent store (Redis, DB), replace these two functions
// — callers remain unchanged.
const otpStore = new Map<string, OtpEntry>();

/** Generates a random 6-digit OTP, stores it, and returns it. */
export const generateOtp = (mobile: string): string => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(mobile, {
    otp,
    expiresAt: Date.now() + env.otpExpiryMinutes * 60 * 1000,
  });
  return otp;
};

/**
 * Verifies the OTP for a mobile number.
 * Returns true and deletes the entry on success (one-time use).
 * Returns false without throwing for invalid or expired OTPs.
 */
export const consumeOtp = (mobile: string, candidate: string): boolean => {
  const entry = otpStore.get(mobile);
  if (!entry) return false;

  if (entry.expiresAt < Date.now()) {
    otpStore.delete(mobile);
    return false;
  }

  if (entry.otp !== candidate) return false;

  otpStore.delete(mobile); // one-time use
  return true;
};
