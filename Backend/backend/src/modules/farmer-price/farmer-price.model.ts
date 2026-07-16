import { Schema, model } from "mongoose";
import {
  CONFIDENCE_LEVELS,
  REASON_TYPES,
} from "./farmer-price.constants";
import type { IFarmerPricePoll, IFarmerPriceVote } from "./farmer-price.types";

const FarmerPricePollSchema = new Schema<IFarmerPricePoll>(
  {
    crop: { type: String, required: true, trim: true, index: true },
    district: { type: String, required: true, trim: true, index: true },
    governmentPriceSnapshot: { type: Number, default: null, min: 0 },
    governmentPriceDate: { type: Date, default: null },
    governmentUnit: { type: String, default: null, trim: true },
    governmentPriceAvailable: { type: Boolean, required: true, default: false },
    communityExpectedPrice: { type: Number, default: null, min: 0 },
    voteCount: { type: Number, required: true, default: 0, min: 0 },
    confidence: {
      type: String,
      enum: CONFIDENCE_LEVELS,
      required: true,
      default: "NOT_AVAILABLE",
    },
    minimumVotesReached: { type: Boolean, required: true, default: false },
    lastVoteAt: { type: Date, default: null, index: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
    collection: "farmer_price_polls",
  }
);

FarmerPricePollSchema.index({ district: 1, crop: 1, endsAt: -1 });

const FarmerPriceVoteSchema = new Schema<IFarmerPriceVote>(
  {
    pollId: {
      type: Schema.Types.ObjectId,
      ref: "FarmerPricePoll",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    district: { type: String, required: true, trim: true, index: true },
    crop: { type: String, required: true, trim: true, index: true },
    expectedPrice: { type: Number, required: true, min: 0 },
    reasonType: { type: String, enum: REASON_TYPES },
    reasonText: { type: String, trim: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "farmer_price_votes",
  }
);

FarmerPriceVoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });
FarmerPriceVoteSchema.index({ pollId: 1, createdAt: -1 });

export const FarmerPricePoll = model<IFarmerPricePoll>(
  "FarmerPricePoll",
  FarmerPricePollSchema
);

export const FarmerPriceVote = model<IFarmerPriceVote>(
  "FarmerPriceVote",
  FarmerPriceVoteSchema
);
