import { Schema, model, type Types } from "mongoose";

export interface IAdminAuditLog {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  adminName: string;
  adminRole: string;
  actorUserId: Types.ObjectId | null;
  action: string;
  entity: string;
  entityId: string | null;
  affectedUserId: Types.ObjectId | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    adminName: { type: String, required: true, trim: true },
    adminRole: { type: String, required: true, trim: true },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      default: null,
      index: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    entity: { type: String, required: true, trim: true, index: true },
    entityId: { type: String, default: null, trim: true, index: true },
    affectedUserId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      default: null,
      index: true,
    },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, default: null, trim: true },
    ip: { type: String, default: null, trim: true },
    userAgent: { type: String, default: null, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "admin_audit_logs",
  }
);

AdminAuditLogSchema.index({ createdAt: -1 });
AdminAuditLogSchema.index({ action: 1, createdAt: -1 });
AdminAuditLogSchema.index({ affectedUserId: 1, createdAt: -1 });

export const AdminAuditLog = model<IAdminAuditLog>(
  "AdminAuditLog",
  AdminAuditLogSchema
);
