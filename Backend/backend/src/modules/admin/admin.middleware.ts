import { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthUser } from "../auth/auth.middleware";
import type { AdminPermission } from "./admin.constants";
import type { AdminProfileDTO } from "./admin.dto";
import {
  assertPermission,
  getAdminForUser,
  toAdminProfileDTO,
} from "./admin.service";
import { findAdminByPhone } from "./admin.repository";

declare global {
  namespace Express {
    interface Request {
      /** Active portal admin profile — set by requirePortalAdmin. */
      admin?: AdminProfileDTO;
    }
  }
}

/**
 * After JWT auth: require an active record in the `admins` collection.
 * Authorization is independent of the phone number entered before OTP —
 * identity comes from the verified session (userId / mobile on the JWT).
 */
export const requirePortalAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { userId, mobile } = getAuthUser(req);

    let admin = await getAdminForUser(userId);

    // Fallback: linked userId may be missing until first login after seed.
    if (!admin) {
      const byPhone = await findAdminByPhone(mobile);
      if (byPhone?.isActive) {
        admin = toAdminProfileDTO(byPhone);
      }
    }

    if (!admin || !admin.isActive) {
      throw new AppError("Admin access required.", 403);
    }

    req.admin = admin;
    next();
  }
);

export const requireAdminPermission =
  (permission: AdminPermission) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new AppError("Admin access required.", 403));
      return;
    }
    try {
      assertPermission(req.admin, permission);
      next();
    } catch (error) {
      next(error);
    }
  };

export const getPortalAdmin = (req: Request): AdminProfileDTO => {
  if (!req.admin) {
    throw new AppError("Admin access required.", 403);
  }
  return req.admin;
};
