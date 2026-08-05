import { Types } from "mongoose";
import type { Request } from "express";
import type { AdminProfileDTO } from "../admin.dto";
import { AdminAuditLog, type IAdminAuditLog } from "./admin-audit.model";

export interface WriteAdminAuditInput {
  admin: AdminProfileDTO;
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  affectedUserId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

const toObjectIdOrNull = (value?: string | null): Types.ObjectId | null => {
  if (!value || !Types.ObjectId.isValid(value)) return null;
  return new Types.ObjectId(value);
};

export const writeAdminAudit = async (
  input: WriteAdminAuditInput
): Promise<IAdminAuditLog> => {
  const doc = await AdminAuditLog.create({
    adminId: new Types.ObjectId(input.admin.id),
    adminName: input.admin.name,
    adminRole: input.admin.role,
    actorUserId: toObjectIdOrNull(input.actorUserId),
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    affectedUserId: toObjectIdOrNull(input.affectedUserId),
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    reason: input.reason ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
  });
  return doc.toObject() as IAdminAuditLog;
};

export const auditContextFromRequest = (
  req: Request
): { ip: string | null; userAgent: string | null } => ({
  ip:
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
      : null) ||
    req.ip ||
    null,
  userAgent:
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"]
      : null,
});
