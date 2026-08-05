import { Schema, model } from "mongoose";
import { SUBSCRIPTION_STATUSES } from "./subscription.constants";
import type { IUserSubscription } from "./interfaces/subscription.interface";

const SubscriptionEventSchema = new Schema(
  {
    type: { type: String, required: true },
    source: {
      type: String,
      enum: ["VERIFY", "WEBHOOK", "RECONCILIATION", "API"],
      required: true,
    },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const SubscriptionMetaSchema = new Schema(
  {
    paymentGateway: { type: String, default: "RAZORPAY" },
    gatewayVersion: { type: String, default: null },
    gatewayResponse: { type: Schema.Types.Mixed, default: null },
    processingSource: {
      type: String,
      enum: ["VERIFY", "WEBHOOK", "RECONCILIATION", "API"],
      default: null,
    },
  },
  { _id: false }
);

const BillingPaymentSchema = new Schema(
  {
    paymentId: { type: String, required: true, trim: true },
    invoiceId: { type: String, default: null, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR", uppercase: true },
    status: {
      type: String,
      enum: ["PAID", "FAILED", "PENDING", "REFUNDED"],
      required: true,
      default: "PAID",
    },
    paymentMethod: { type: String, default: null, trim: true },
    paidAt: { type: Date, required: true },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    gateway: { type: String, required: true, default: "RAZORPAY" },
    subscriptionId: { type: String, default: null, trim: true },
    refundId: { type: String, default: null, trim: true },
    refundedAt: { type: Date, default: null },
    refundAmount: { type: Number, default: null, min: 0 },
    refundReason: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const UserSubscriptionSchema = new Schema<IUserSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    planId: { type: String, required: true, trim: true },
    subscriptionId: { type: String, default: null, trim: true },
    customerId: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      required: true,
      default: "CREATED",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "INR", uppercase: true },
    quantity: { type: Number, required: true, default: 1 },
    totalCount: { type: Number, required: true },
    paidCount: { type: Number, required: true, default: 0 },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    nextChargeAt: { type: Date, default: null },
    paymentMethod: { type: String, default: null, trim: true },
    latestPaymentId: { type: String, default: null, trim: true },
    cancelledAt: { type: Date, default: null },
    cancelAtCycleEnd: { type: Boolean, required: true, default: false },
    accessRevokedAt: { type: Date, default: null },
    shortUrl: { type: String, default: null, trim: true },
    notes: { type: Schema.Types.Mixed, default: {} },
    events: { type: [SubscriptionEventSchema], default: [] },
    billingPayments: { type: [BillingPaymentSchema], default: [] },
    meta: { type: SubscriptionMetaSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: "user_subscriptions",
    strict: true,
  }
);

UserSubscriptionSchema.index(
  { subscriptionId: 1 },
  {
    unique: true,
    partialFilterExpression: { subscriptionId: { $type: "string" } },
  }
);

UserSubscriptionSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export const UserSubscription = model<IUserSubscription>(
  "UserSubscription",
  UserSubscriptionSchema
);
