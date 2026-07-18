import { Schema, model } from "mongoose";
import {
  APPLICATION_STATUSES,
  GENDERS,
  PAYMENT_STATUSES,
} from "./gram-sahakari.constants";
import type { IGramSahakariApplication } from "./interfaces/application.interface";

const CloudinaryDocumentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ExperienceCertificateSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
  },
  { _id: false }
);

const GramSahakariApplicationSchema = new Schema<IGramSahakariApplication>(
  {
    applicationNumber: {
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
      default: "DRAFT",
      index: true,
    },
    fullName: { type: String, default: null, trim: true },
    phone: { type: String, default: null, trim: true, index: true },
    email: { type: String, default: null, trim: true, lowercase: true },
    gender: { type: String, enum: GENDERS, default: null },
    dob: { type: Date, default: null },
    photo: { type: CloudinaryDocumentSchema, default: null },
    district: { type: String, default: null, trim: true, index: true },
    taluka: { type: String, default: null, trim: true },
    village: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    pincode: { type: String, default: null, trim: true },
    aadhaarNumber: { type: String, default: null, trim: true },
    aadhaarFront: { type: CloudinaryDocumentSchema, default: null },
    aadhaarBack: { type: CloudinaryDocumentSchema, default: null },
    panNumber: { type: String, default: null, trim: true, uppercase: true },
    panImage: { type: CloudinaryDocumentSchema, default: null },
    cancelledChequeImage: { type: CloudinaryDocumentSchema, default: null },
    bankAccountHolder: { type: String, default: null, trim: true },
    bankAccountNumber: { type: String, default: null, trim: true },
    bankIFSC: { type: String, default: null, trim: true, uppercase: true },
    bankName: { type: String, default: null, trim: true },
    education: { type: String, default: null, trim: true },
    occupation: { type: String, default: null, trim: true },
    languages: { type: [String], default: [] },
    experience: { type: String, default: null, trim: true },
    experienceCertificates: { type: [ExperienceCertificateSchema], default: [] },
    whyJoin: { type: String, default: null, trim: true },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "NOT_REQUIRED",
      index: true,
    },
    paymentReference: { type: String, default: null, trim: true },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      default: null,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      default: null,
      index: true,
    },
    reviewRemarks: { type: String, default: null, trim: true },
    approvedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null, index: true },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "gram_sahakari_applications",
  }
);

// Unique application number. Partial filter keeps the unique constraint scoped
// to documents that actually have a string applicationNumber, so legacy
// documents (created before this field existed) don't collide on `null` before
// the backfill migration runs. After backfill, every document has a value.
GramSahakariApplicationSchema.index(
  { applicationNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { applicationNumber: { $type: "string" } },
  }
);
GramSahakariApplicationSchema.index({ userId: 1, status: 1 });
GramSahakariApplicationSchema.index({ district: 1, status: 1, submittedAt: -1 });
GramSahakariApplicationSchema.index({ status: 1, submittedAt: -1 });
GramSahakariApplicationSchema.index({ assignedTo: 1, status: 1 });

export const GramSahakariApplication = model<IGramSahakariApplication>(
  "GramSahakariApplication",
  GramSahakariApplicationSchema
);
