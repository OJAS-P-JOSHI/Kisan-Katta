import { GramSahakariApplication } from "../../gram-sahakari/gram-sahakari.model";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import type { PaymentStatus } from "../../gram-sahakari/types/application.types";
import type { IPaymentEvent } from "../interfaces/payment.interface";

export {
  findApplicationByUserId,
  findApplicationById,
} from "../../gram-sahakari/repository/application.repository";

export const findApplicationByRazorpayOrderId = (
  razorpayOrderId: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOne({ razorpayOrderId }).lean();

export const findApplicationByRazorpayPaymentId = (
  razorpayPaymentId: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOne({ razorpayPaymentId }).lean();

export const findPendingPayableApplications = (
  limit: number
): Promise<IGramSahakariApplication[]> =>
  GramSahakariApplication.find({
    paymentStatus: { $in: ["PENDING", "AUTHORIZED"] },
    razorpayOrderId: { $ne: null },
  })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .lean<IGramSahakariApplication[]>();

export interface OrderFields {
  razorpayOrderId: string;
  paymentAmount: number;
  paymentCurrency: string;
}

/**
 * Records a freshly-created Razorpay order on the application, but ONLY while it
 * is PAYMENT_PENDING and unpaid. A paid or officially submitted application can
 * never be dragged back into PENDING. Appends an ORDER_CREATED timeline event
 * atomically in the same write.
 */
export const attachOrderToApplication = (
  applicationId: string,
  fields: OrderFields,
  event: IPaymentEvent
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOneAndUpdate(
    {
      _id: applicationId,
      status: "PAYMENT_PENDING",
      paymentStatus: { $in: ["NOT_REQUIRED", "PENDING", "FAILED"] },
    },
    {
      $set: {
        paymentStatus: "PENDING",
        razorpayOrderId: fields.razorpayOrderId,
        paymentAmount: fields.paymentAmount,
        paymentCurrency: fields.paymentCurrency,
        paymentVerified: false,
      },
      // Drop prior-attempt identity so verify/webhook never compares against a
      // stale payment id left by payment.authorized / a failed Checkout try.
      $unset: {
        razorpayPaymentId: "",
        paymentReference: "",
        paymentMethod: "",
        authorizedAt: "",
        paidAt: "",
        paymentFailureReason: "",
      },
      $push: { paymentEvents: event },
    },
    { new: true, runValidators: true }
  ).lean();

export interface TransitionInput {
  /** Only apply if the current paymentStatus is one of these. */
  fromStates: PaymentStatus[];
  /** Fields to $set on the application. */
  set: Record<string, unknown>;
  /** Timeline events to append. */
  events: IPaymentEvent[];
  /** Increment the attempt counter (frontend-reported failures only). */
  incrementAttempt?: boolean;
}

/**
 * The single atomic write used by the payment finalization service to move an
 * application through the payment state machine. The `fromStates` guard is the
 * concurrency/duplicate-processing backbone: only the first request whose read
 * state still matches wins; every concurrent or replayed request matches zero
 * documents and receives `null`, which the caller treats as an idempotent
 * no-op. MongoDB guarantees single-document atomicity for this update.
 */
export const transitionPayment = (
  applicationId: string,
  input: TransitionInput
): Promise<IGramSahakariApplication | null> => {
  const update: Record<string, unknown> = {
    $set: input.set,
    $push: { paymentEvents: { $each: input.events } },
  };
  if (input.incrementAttempt) {
    update.$inc = { paymentAttemptCount: 1 };
  }

  return GramSahakariApplication.findOneAndUpdate(
    { _id: applicationId, paymentStatus: { $in: input.fromStates } },
    update,
    { new: true, runValidators: true }
  ).lean();
};
