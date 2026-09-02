import { Types } from "mongoose";
import { UserSubscription } from "../subscription.model";
import type {
  IBillingPayment,
  ISubscriptionEvent,
  IUserSubscription,
} from "../interfaces/subscription.interface";
import type { SubscriptionStatus } from "../types/subscription.types";
import { LIVING_SUBSCRIPTION_STATUSES } from "../subscription.constants";

export const findLatestByUserId = (
  userId: string
): Promise<IUserSubscription | null> =>
  UserSubscription.findOne({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean();

export const findBySubscriptionId = (
  subscriptionId: string
): Promise<IUserSubscription | null> =>
  UserSubscription.findOne({ subscriptionId }).lean();

export const findById = (
  id: string
): Promise<IUserSubscription | null> =>
  UserSubscription.findById(id).lean();

/** Open (non-terminal) subscription for a user, newest first. */
export const findLivingByUserId = (
  userId: string
): Promise<IUserSubscription | null> =>
  UserSubscription.findOne({
    userId: new Types.ObjectId(userId),
    status: { $in: [...LIVING_SUBSCRIPTION_STATUSES] },
  })
    .sort({ updatedAt: -1 })
    .lean();

export const createSubscriptionDoc = (
  fields: Partial<IUserSubscription> & {
    userId: Types.ObjectId | string;
    planId: string;
    amount: number;
    currency: string;
    totalCount: number;
    status: SubscriptionStatus;
  }
): Promise<IUserSubscription> =>
  UserSubscription.create({
    ...fields,
    userId:
      typeof fields.userId === "string"
        ? new Types.ObjectId(fields.userId)
        : fields.userId,
  }).then((doc) => doc.toObject() as IUserSubscription);

export interface SubscriptionTransitionInput {
  fromStatuses?: SubscriptionStatus[];
  set: Record<string, unknown>;
  events?: ISubscriptionEvent[];
}

export const transitionSubscription = (
  id: string,
  input: SubscriptionTransitionInput
): Promise<IUserSubscription | null> => {
  const filter: Record<string, unknown> = { _id: id };
  if (input.fromStatuses?.length) {
    filter.status = { $in: input.fromStatuses };
  }

  const update: Record<string, unknown> = { $set: input.set };
  if (input.events?.length) {
    update.$push = { events: { $each: input.events } };
  }

  return UserSubscription.findOneAndUpdate(filter, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
};

export const updateSubscriptionById = (
  id: string,
  set: Record<string, unknown>,
  events?: ISubscriptionEvent[]
): Promise<IUserSubscription | null> => {
  const update: Record<string, unknown> = { $set: set };
  if (events?.length) {
    update.$push = { events: { $each: events } };
  }
  return UserSubscription.findByIdAndUpdate(id, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
};

/**
 * Idempotently records a billing payment by paymentId.
 * If the payment already exists, updates mutable fields; otherwise pushes.
 */
export const upsertBillingPayment = async (
  subscriptionDocId: string,
  payment: IBillingPayment
): Promise<IUserSubscription | null> => {
  const existing = await UserSubscription.findOneAndUpdate(
    {
      _id: subscriptionDocId,
      "billingPayments.paymentId": payment.paymentId,
    },
    {
      $set: {
        "billingPayments.$.invoiceId": payment.invoiceId,
        "billingPayments.$.amount": payment.amount,
        "billingPayments.$.currency": payment.currency,
        "billingPayments.$.status": payment.status,
        "billingPayments.$.paymentMethod": payment.paymentMethod,
        "billingPayments.$.paidAt": payment.paidAt,
        "billingPayments.$.periodStart": payment.periodStart,
        "billingPayments.$.periodEnd": payment.periodEnd,
        "billingPayments.$.gateway": payment.gateway,
        "billingPayments.$.subscriptionId": payment.subscriptionId,
        "billingPayments.$.refundId": payment.refundId ?? null,
        "billingPayments.$.refundedAt": payment.refundedAt ?? null,
        "billingPayments.$.refundAmount": payment.refundAmount ?? null,
        "billingPayments.$.refundReason": payment.refundReason ?? null,
      },
    },
    { returnDocument: "after" }
  ).lean();

  if (existing) return existing;

  return UserSubscription.findByIdAndUpdate(
    subscriptionDocId,
    { $push: { billingPayments: payment } },
    { returnDocument: "after", runValidators: true }
  ).lean();
};

/** Subscriptions that may need a Razorpay sync (recon sweep). */
export const findReconcileCandidates = (
  limit: number
): Promise<IUserSubscription[]> =>
  UserSubscription.find({
    subscriptionId: { $ne: null },
    "notes.testerAccess": { $ne: true },
    status: {
      $in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PENDING", "HALTED", "PAUSED"],
    },
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean<IUserSubscription[]>();

export const findByBillingPaymentId = (
  paymentId: string
): Promise<IUserSubscription | null> =>
  UserSubscription.findOne({
    "billingPayments.paymentId": paymentId,
  }).lean<IUserSubscription | null>();

export const listSubscriptionsAdmin = (params: {
  filter: Record<string, unknown>;
  skip: number;
  limit: number;
}): Promise<{ rows: IUserSubscription[]; total: number }> =>
  Promise.all([
    UserSubscription.countDocuments(params.filter),
    UserSubscription.find(params.filter)
      .sort({ updatedAt: -1 })
      .skip(params.skip)
      .limit(params.limit)
      .lean<IUserSubscription[]>(),
  ]).then(([total, rows]) => ({ total, rows }));
