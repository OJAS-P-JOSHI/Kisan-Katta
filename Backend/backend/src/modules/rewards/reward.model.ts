import { Schema, model, type Types } from "mongoose";
import {
  REWARD_PAYMENT_METHODS,
  REWARD_REASONS,
  REWARD_STATUSES,
  type RewardPaymentMethod,
  type RewardReason,
  type RewardStatus,
} from "./reward.constants";

export interface IReward {
  _id: Types.ObjectId;
  rewardId: string;
  /** Application document id (Village Representative). */
  villageRepresentativeId: Types.ObjectId;
  applicationId: Types.ObjectId;
  villageRepresentativeName: string;
  volunteerId: string;
  district: string | null;
  taluka: string | null;
  village: string | null;
  photoUrl: string | null;
  amount: number;
  reason: RewardReason;
  description: string | null;
  status: RewardStatus;
  paymentMethod: RewardPaymentMethod;
  transactionReference: string | null;
  paidDate: Date | null;
  approvedDate: Date | null;
  approvedBy: string | null;
  createdBy: string;
  updatedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema<IReward>(
  {
    rewardId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    villageRepresentativeId: {
      type: Schema.Types.ObjectId,
      ref: "GramSahakariApplication",
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: "GramSahakariApplication",
      required: true,
      index: true,
    },
    villageRepresentativeName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    volunteerId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    district: { type: String, default: null, trim: true, index: true },
    taluka: { type: String, default: null, trim: true },
    village: { type: String, default: null, trim: true },
    photoUrl: { type: String, default: null, trim: true },
    amount: { type: Number, required: true, min: 1 },
    reason: {
      type: String,
      enum: REWARD_REASONS,
      required: true,
      index: true,
    },
    description: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: REWARD_STATUSES,
      required: true,
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: REWARD_PAYMENT_METHODS,
      required: true,
    },
    transactionReference: { type: String, default: null, trim: true },
    paidDate: { type: Date, default: null, index: true },
    approvedDate: { type: Date, default: null },
    approvedBy: { type: String, default: null, trim: true },
    createdBy: { type: String, required: true, trim: true },
    updatedBy: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    collection: "rewards",
  }
);

RewardSchema.index({
  villageRepresentativeName: "text",
  volunteerId: "text",
  district: "text",
  reason: "text",
  rewardId: "text",
});

RewardSchema.index({ status: 1, createdAt: -1 });
RewardSchema.index({ applicationId: 1, createdAt: -1 });
RewardSchema.index({ amount: 1 });

export const Reward = model<IReward>("Reward", RewardSchema);
