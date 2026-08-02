import { Schema, model } from "mongoose";
import {
  DESCRIPTION_MAX_LENGTH,
  HELP_REQUEST_STATUSES,
  MAX_HELP_REQUEST_IMAGES,
  REPORT_REASONS,
  TITLE_MAX_LENGTH,
} from "./assistance.constants";
import type {
  HelpRequestImage,
  IHelpRequest,
  IHelpRequestAuthor,
  IHelpRequestReport,
  IHelpRequestSupport,
} from "./assistance.types";

// Cloudinary metadata only — binary image data is never stored in MongoDB.
const HelpRequestImageSchema = new Schema<HelpRequestImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const HelpRequestAuthorSchema = new Schema<IHelpRequestAuthor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    profilePhoto: { type: String, default: null },
    village: { type: String, required: true, trim: true },
    taluka: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    verified: { type: Boolean, required: true, default: false },
  },
  { _id: false }
);

const HelpRequestSchema = new Schema<IHelpRequest>(
  {
    author: { type: HelpRequestAuthorSchema, required: true },
    title: { type: String, required: true, trim: true, maxlength: TITLE_MAX_LENGTH },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: DESCRIPTION_MAX_LENGTH,
    },
    images: {
      type: [HelpRequestImageSchema],
      required: true,
      validate: {
        validator: (value: HelpRequestImage[]) =>
          value.length >= 1 && value.length <= MAX_HELP_REQUEST_IMAGES,
        message: `images must contain between 1 and ${MAX_HELP_REQUEST_IMAGES} items.`,
      },
    },
    status: {
      type: String,
      enum: HELP_REQUEST_STATUSES,
      required: true,
      // New requests are public immediately; admins retain reject/archive.
      default: "OPEN",
    },
    supportCount: { type: Number, required: true, default: 0, min: 0 },
    reportCount: { type: Number, required: true, default: 0, min: 0 },
    isDeleted: { type: Boolean, required: true, default: false },
    deletedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    moderationNote: { type: String, default: null, trim: true },
    resolvedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "help_requests",
  }
);

HelpRequestSchema.index({ status: 1 });
HelpRequestSchema.index({ "author.userId": 1 });
HelpRequestSchema.index({ "author.district": 1 });
HelpRequestSchema.index({ createdAt: -1 });

// Feed and quota queries always filter isDeleted + status; compound indexes
// support match + sort without an in-memory sort stage.
HelpRequestSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
HelpRequestSchema.index({ isDeleted: 1, status: 1, supportCount: -1, createdAt: -1 });
HelpRequestSchema.index({ "author.district": 1, status: 1, createdAt: -1 });
HelpRequestSchema.index({ "author.userId": 1, status: 1, createdAt: -1 });
HelpRequestSchema.index({ "author.userId": 1, isDeleted: 1, status: 1 });
HelpRequestSchema.index({ title: "text", description: "text" });

const HelpRequestSupportSchema = new Schema<IHelpRequestSupport>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
    collection: "help_request_supports",
  }
);

// One support per user per request — enforced in the database, not only in code.
HelpRequestSupportSchema.index({ requestId: 1, userId: 1 }, { unique: true });
HelpRequestSupportSchema.index({ userId: 1, createdAt: -1 });

const HelpRequestReportSchema = new Schema<IHelpRequestReport>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "HelpRequest",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: null, trim: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
    collection: "help_request_reports",
  }
);

// One report per user per request.
HelpRequestReportSchema.index({ requestId: 1, userId: 1 }, { unique: true });

export const HelpRequest = model<IHelpRequest>("HelpRequest", HelpRequestSchema);

export const HelpRequestSupport = model<IHelpRequestSupport>(
  "HelpRequestSupport",
  HelpRequestSupportSchema
);

export const HelpRequestReport = model<IHelpRequestReport>(
  "HelpRequestReport",
  HelpRequestReportSchema
);
