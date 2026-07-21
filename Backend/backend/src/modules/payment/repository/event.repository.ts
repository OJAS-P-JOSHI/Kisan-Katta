import { Types } from "mongoose";
import { RazorpayEvent } from "../payment-event.model";
import type { IRazorpayEvent } from "../interfaces/payment.interface";
import type {
  EventDeliverySource,
  EventProcessingResult,
} from "../types/payment.types";

export interface EventClaim {
  /** True when THIS caller owns processing of the event and must proceed. */
  claimed: boolean;
  /** True when the event was already processed/ignored and must be skipped. */
  duplicate: boolean;
  existing: IRazorpayEvent | null;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

/**
 * Atomically claims a Razorpay event for processing.
 *
 * Implemented as an upsert that returns the PRE-image (`new: false`):
 *  - `null` returned  => we just inserted the row and therefore own processing.
 *  - existing PROCESSED/IGNORED/DUPLICATE => a prior delivery already handled
 *    it; this is a duplicate and must be skipped.
 *  - existing PROCESSING => another concurrent worker holds it; skip.
 *  - existing FAILED => a previous attempt errored out; allow a reprocess.
 *
 * The unique index on `razorpayEventId` makes this race-safe: a concurrent
 * upsert either loses and reads the winning row, or throws a duplicate-key
 * error which we treat as "already claimed".
 */
export const claimEvent = async (
  razorpayEventId: string,
  eventType: string,
  deliverySource: EventDeliverySource
): Promise<EventClaim> => {
  try {
    const existing = await RazorpayEvent.findOneAndUpdate(
      { razorpayEventId },
      {
        $setOnInsert: {
          razorpayEventId,
          eventType,
          deliverySource,
          processingResult: "PROCESSING",
          receivedAt: new Date(),
        },
      },
      { upsert: true, new: false, setDefaultsOnInsert: true }
    ).lean<IRazorpayEvent | null>();

    if (!existing) {
      return { claimed: true, duplicate: false, existing: null };
    }

    if (existing.processingResult === "FAILED") {
      return { claimed: true, duplicate: false, existing };
    }

    return { claimed: false, duplicate: true, existing };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const existing = await RazorpayEvent.findOne({ razorpayEventId }).lean<
        IRazorpayEvent | null
      >();
      return { claimed: false, duplicate: true, existing };
    }
    throw error;
  }
};

export const completeEvent = (
  razorpayEventId: string,
  processingResult: EventProcessingResult,
  applicationId?: string | null
): Promise<IRazorpayEvent | null> =>
  RazorpayEvent.findOneAndUpdate(
    { razorpayEventId },
    {
      $set: {
        processingResult,
        processedAt: new Date(),
        ...(applicationId
          ? { applicationId: new Types.ObjectId(applicationId) }
          : {}),
      },
    },
    { new: true }
  ).lean<IRazorpayEvent | null>();

export const findEventById = (
  razorpayEventId: string
): Promise<IRazorpayEvent | null> =>
  RazorpayEvent.findOne({ razorpayEventId }).lean<IRazorpayEvent | null>();
