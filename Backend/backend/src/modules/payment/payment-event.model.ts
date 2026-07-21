import { Schema, model } from "mongoose";
import {
  EVENT_DELIVERY_SOURCES,
  EVENT_PROCESSING_RESULTS,
} from "./payment.constants";
import type { IRazorpayEvent } from "./interfaces/payment.interface";

/**
 * Ledger of every Razorpay event we have seen, keyed by the gateway-provided
 * event id. The unique index on `razorpayEventId` is the backbone of
 * exactly-once processing: a duplicate webhook (or a verify replay) can never
 * create a second row, so the same event is never processed twice — even
 * across backend restarts, since the state lives entirely in MongoDB.
 */
const RazorpayEventSchema = new Schema<IRazorpayEvent>(
  {
    razorpayEventId: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, trim: true },
    deliverySource: {
      type: String,
      enum: EVENT_DELIVERY_SOURCES,
      required: true,
    },
    processingResult: {
      type: String,
      enum: EVENT_PROCESSING_RESULTS,
      required: true,
      default: "PROCESSING",
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "GramSahakariApplication",
      default: null,
      index: true,
    },
    receivedAt: { type: Date, required: true, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "razorpay_events" }
);

RazorpayEventSchema.index({ razorpayEventId: 1 }, { unique: true });

export const RazorpayEvent = model<IRazorpayEvent>(
  "RazorpayEvent",
  RazorpayEventSchema
);
