import { AppError } from "../../utils/AppError";

/**
 * Validates an Indian mobile number and returns it in E.164 format.
 *
 * Accepted input forms:
 *   9876543210        → +919876543210
 *   +919876543210     → +919876543210
 *   09876543210       → +919876543210
 *
 * The returned E.164 string (+919876543210) is what is stored in the
 * database and embedded in the JWT payload.
 */
export const validateMobile = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new AppError("mobile is required.", 400);
  }

  const cleaned = value
    .trim()
    .replace(/^\+91/, "")   // strip +91 country code
    .replace(/^0/, "")      // strip leading 0
    .replace(/\s/g, "");    // collapse any spaces

  if (!/^\d{10}$/.test(cleaned)) {
    throw new AppError("mobile must be a valid 10-digit Indian mobile number.", 400);
  }

  // Normalise to E.164: +91 prefix ensures consistent DB storage and JWT payload.
  return `+91${cleaned}`;
};

/** Validates a 6-digit numeric OTP. */
export const validateOtp = (value: unknown): string => {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
    throw new AppError("otp must be a 6-digit number.", 400);
  }
  return value;
};
