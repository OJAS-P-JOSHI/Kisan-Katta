import { Schema, model } from "mongoose";
import { SUPPORTED_LANGUAGES } from "./profile.types";
import type { IFarmerProfile } from "./profile.types";

const FarmerProfileSchema = new Schema<IFarmerProfile>(
  {
    // One profile per auth_user; enforced by unique index.
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true },
    taluka: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    favoriteCrops: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 10,
        message: "favoriteCrops must have between 1 and 10 items.",
      },
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGES,
      required: true,
      default: "mr",
    },
    // Cloudinary metadata only — never store raw bytes or base64.
    profileImage: {
      type: new Schema(
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
        { _id: false }
      ),
      default: null,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "farmer_profiles",
  }
);

export const FarmerProfile = model<IFarmerProfile>("FarmerProfile", FarmerProfileSchema);
