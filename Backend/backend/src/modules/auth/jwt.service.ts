import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import type { JwtPayload } from "./auth.types";

/** Signs and returns a JWT containing the given payload. */
export const signToken = (payload: JwtPayload): string => {
  // SignOptions.expiresIn uses the branded ms.StringValue type.
  // env.jwtExpiresIn is always a valid duration string (e.g. "30d").
  // The explicit downcast bridges plain string → StringValue.
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtSecret, options);
};

/**
 * Verifies a token and returns its decoded payload.
 * Throws AppError(401) for any invalid or expired token so callers
 * never need their own try/catch around JWT errors.
 */
export const verifyToken = (token: string): JwtPayload => {
  let raw: jwt.JwtPayload;

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    // jwt.verify returns string only for non-object (string) payloads
    if (typeof decoded === "string") {
      throw new AppError("Invalid token.", 401);
    }
    raw = decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    // Handles JsonWebTokenError, TokenExpiredError, NotBeforeError
    throw new AppError("Invalid or expired token. Please authenticate again.", 401);
  }

  const userId = raw["userId"];
  const mobile = raw["mobile"];

  if (typeof userId !== "string" || typeof mobile !== "string") {
    throw new AppError("Invalid token payload.", 401);
  }

  return { userId, mobile };
};
