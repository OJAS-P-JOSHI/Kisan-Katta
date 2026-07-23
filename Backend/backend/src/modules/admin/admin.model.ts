import { Schema, model, type Types } from "mongoose";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLES,
  type AdminPermission,
  type AdminRole,
} from "./admin.constants";

export interface IAdminAddress {
  line1: string;
  taluka: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IAdmin {
  _id: Types.ObjectId;
  name: string;
  phoneNumber: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  /** Linked AuthUser id after first successful OTP login (optional until then). */
  userId: Types.ObjectId | null;
  address: IAdminAddress;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAddressSchema = new Schema<IAdminAddress>(
  {
    line1: { type: String, required: true, trim: true },
    taluka: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ADMIN_ROLES,
      required: true,
      index: true,
    },
    permissions: {
      type: [String],
      enum: ADMIN_PERMISSIONS,
      required: true,
      default: [],
    },
    isActive: { type: Boolean, required: true, default: true, index: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      default: null,
      index: true,
    },
    address: { type: AdminAddressSchema, required: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "admins",
  }
);

export const Admin = model<IAdmin>("Admin", AdminSchema);
