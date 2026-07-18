import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/AppError";
import { asyncHandler } from "../../../utils/asyncHandler";
import type { UserRole } from "../../auth/auth.constants";
import { USER_ROLES } from "../../auth/auth.constants";
import { getAuthUser } from "../../auth/auth.middleware";

export const requireRoles =
  (...allowedRoles: UserRole[]) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const { role } = getAuthUser(req);

    if (!(allowedRoles as readonly string[]).includes(role)) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }

    next();
  });

export const requireAdmin = requireRoles("ADMIN");
export const requireAdminOrTeam = requireRoles("ADMIN", "TEAM");

export const assertKnownRole = (role: string): UserRole => {
  if (!(USER_ROLES as readonly string[]).includes(role)) {
    throw new AppError("Invalid user role.", 403);
  }
  return role as UserRole;
};
