import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyToken } from "./jwt.service";
import { AuthUser } from "./auth.model";

/**
 * Reads the Bearer token from the Authorization header, verifies it,
 * confirms the user still exists in the database, then attaches
 * { userId, mobile } to req.user for downstream handlers.
 *
 * Throws AppError(401) for missing, invalid, or expired tokens.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        "Authentication required. Please provide a valid Bearer token.",
        401
      );
    }

    const token = authHeader.slice(7); // remove "Bearer " prefix

    // verifyToken wraps all JWT errors as AppError(401) — no local try/catch needed
    const payload = verifyToken(token);

    // Confirm the account still exists and load current role (handles deleted-user
    // edge case and ensures role changes take effect without re-login).
    const user = await AuthUser.findById(payload.userId).select("mobile role").lean();
    if (!user) {
      throw new AppError("User account no longer exists.", 401);
    }

    req.user = {
      userId: payload.userId,
      mobile: user.mobile,
      role: user.role ?? "FARMER",
    };
    next();
  }
);

/**
 * Retrieves the authenticated user from req.user.
 * Use inside any protected handler after the authenticate middleware.
 * Throws if called on an unprotected route (programming error, not user error).
 */
export const getAuthUser = (
  req: Request
): { userId: string; mobile: string; role: import("./auth.constants").UserRole } => {
  if (!req.user) {
    throw new AppError("Authentication required.", 401);
  }
  return req.user;
};
