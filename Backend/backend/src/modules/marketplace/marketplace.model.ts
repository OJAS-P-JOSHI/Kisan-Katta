import { Schema, model } from "mongoose";
import {
  LABOUR_GENDERS,
  LABOUR_RATE_TYPES,
  LISTING_STATUSES,
  LISTING_TYPES,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_UNITS,
  MAX_LISTING_IMAGES,
} from "./marketplace.constants";
import type { IMarketplaceListing, IMarketplaceSaved } from "./marketplace.types";

const MarketplaceListingSchema = new Schema<IMarketplaceListing>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    listingType: {
      type: String,
      enum: LISTING_TYPES,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: MARKETPLACE_CATEGORIES,
      required: true,
      index: true,
    },
    subcategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, min: 0 },
    unit: { type: String, enum: MARKETPLACE_UNITS },
    images: {
      type: [Schema.Types.Mixed],
      default: [],
      validate: {
        validator: (value: unknown[]) => value.length <= MAX_LISTING_IMAGES,
        message: `images cannot contain more than ${MAX_LISTING_IMAGES} items.`,
      },
    } as unknown as Schema<IMarketplaceListing>["obj"]["images"],
    district: { type: String, required: true, index: true },
    village: { type: String, trim: true, index: true },
    taluka: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: LISTING_STATUSES,
      required: true,
      default: "ACTIVE",
      index: true,
    },
    views: { type: Number, required: true, default: 0, min: 0 },
    contactClicks: { type: Number, required: true, default: 0, min: 0 },
    expiresAt: { type: Date, required: true, index: true },
    crop: { type: String, trim: true },
    harvestDate: { type: Date },
    moisture: { type: Number, min: 0 },
    expectedPrice: { type: Number, min: 0 },
    brand: { type: String, trim: true },
    stock: { type: Number, min: 0 },
    availableWorkers: { type: Number, min: 1 },
    gender: { type: String, enum: LABOUR_GENDERS },
    rateType: { type: String, enum: LABOUR_RATE_TYPES },
    availableFrom: { type: Date },
  },
  {
    timestamps: true,
    collection: "marketplace",
  }
);

MarketplaceListingSchema.index(
  {
    title: "text",
    description: "text",
    crop: "text",
    category: "text",
    village: "text",
    taluka: "text",
    district: "text",
  },
  { name: "marketplace_text_search", default_language: "none" }
);

// Browse filter always includes status + expiresAt; compound indexes support match + sort.
MarketplaceListingSchema.index({ status: 1, expiresAt: 1, createdAt: -1 });
MarketplaceListingSchema.index({ status: 1, expiresAt: 1, price: 1 });
MarketplaceListingSchema.index({ sellerId: 1, createdAt: -1 });
MarketplaceListingSchema.index({ sellerId: 1, listingType: 1, status: 1 });

const MarketplaceSavedSchema = new Schema<IMarketplaceSaved>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "AuthUser",
      required: true,
      index: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "MarketplaceListing",
      required: true,
      index: true,
    },
    savedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
    collection: "marketplace_saved",
  }
);

MarketplaceSavedSchema.index({ userId: 1, listingId: 1 }, { unique: true });
MarketplaceSavedSchema.index({ userId: 1, savedAt: -1 });

export const MarketplaceListing = model<IMarketplaceListing>(
  "MarketplaceListing",
  MarketplaceListingSchema
);

export const MarketplaceSaved = model<IMarketplaceSaved>(
  "MarketplaceSaved",
  MarketplaceSavedSchema
);
