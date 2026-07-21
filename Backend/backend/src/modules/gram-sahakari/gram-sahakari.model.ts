import { Schema, model } from "mongoose";
import {
  APPLICATION_STATUSES,
  GENDERS,
  PAYMENT_STATUSES,
} from "./gram-sahakari.constants";
import {
  PAYMENT_EVENT_TYPES,
  PROCESSING_SOURCES,
} from "../payment/payment.constants";
import type { IGramSahakariApplication } from "./interfaces/application.interface";

const CloudinaryDocumentSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PaymentEventSchema = new Schema(
  {
    type: { type: String, enum: PAYMENT_EVENT_TYPES, required: true },
    source: { type: String, enum: PROCESSING_SOURCES, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const PaymentMetaSchema = new Schema(
  {
    paymentGateway: { type: String, default: null },
    gatewayVersion: { type: String, default: null },
    gatewayResponse: { type: Schema.Types.Mixed, default: null },
    processingSource: { type: String, enum: PROCESSING_SOURCES, default: null },
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
    cancelledChequeImage: { type: CloudinaryDocumentSchema, default: null },
    bankAccountHolder: { type: String, default: null, trim: true },
    bankAccountNumber: { type: String, default: null, trim: true },
    bankIFSC: { type: String, default: null, trim: true, uppercase: true },
    bankName: { type: String, default: null, trim: true },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "NOT_REQUIRED",
      index: true,
    },
    paymentReference: { type: String, default: null, trim: true },
    paymentAmount: { type: Number, default: null },
    paymentCurrency: { type: String, default: null, trim: true, uppercase: true },
    razorpayOrderId: { type: String, default: null, trim: true },
    razorpayPaymentId: { type: String, default: null, trim: true },
    paidAt: { type: Date, default: null },
    paymentMethod: { type: String, default: null, trim: true },
    paymentFailureReason: { type: String, default: null, trim: true },
    paymentAttemptCount: { type: Number, required: true, default: 0 },
    paymentVerified: { type: Boolean, required: true, default: false },
    authorizedAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
    refundId: { type: String, default: null, trim: true },
    paymentEvents: { type: [PaymentEventSchema], default: [] },
    paymentMeta: { type: PaymentMetaSchema, default: () => ({}) },
    submittedAt: { type: Date, default: null, index: true },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "gram_sahakari_applications",
    strict: true,
  }
);

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
GramSahakariApplicationSchema.index(
  { razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayOrderId: { $type: "string" },
    },
  }
);
// Webhook/refund lookups resolve an application by the gateway payment id
// (findApplicationByRazorpayPaymentId). Unique + partial so a payment id maps to
// at most one application (identity integrity) while unset/null docs are skipped.
GramSahakariApplicationSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: { $type: "string" },
    },
  }
);
// Backs the reconciliation sweep query: paymentStatus in {PENDING,AUTHORIZED}
// with razorpayOrderId set, oldest updatedAt first.
GramSahakariApplicationSchema.index({ paymentStatus: 1, updatedAt: 1 });

export const GramSahakariApplication = model<IGramSahakariApplication>(
  "GramSahakariApplication",
  GramSahakariApplicationSchema
);
