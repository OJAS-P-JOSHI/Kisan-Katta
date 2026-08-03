import { Types } from "mongoose";
import type { HydratedDocument, PipelineStage } from "mongoose";
import { AppError } from "../../utils/AppError";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { getProfile } from "../profile/profile.service";
import {
  LABOUR_CATEGORIES,
  LISTING_EXPIRY_DAYS,
  MAX_ACTIVE_LABOUR_LISTINGS,
  MAX_LABOUR_LISTING_IMAGES,
} from "./marketplace.constants";
import { normalizeListingImages, toStoredListingImages } from "./marketplace.image.utils";
import { MarketplaceListing, MarketplaceSaved } from "./marketplace.model";
import { buildLabourTitle } from "./marketplace.validation";
import type {
  CreateListingBody,
  IMarketplaceListing,
  ListingDetailResponseDTO,
  ListingResponseDTO,
  ListingsQuery,
  MyMarketplaceSummaryDTO,
  PaginatedListingsDTO,
  SavedListingsDTO,
  SellerInfoDTO,
  UpdateListingBody,
} from "./marketplace.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const toListingDTO = (
  doc: HydratedDocument<IMarketplaceListing>
): ListingResponseDTO => ({
  id: doc._id.toString(),
  sellerId: doc.sellerId.toString(),
  listingType: doc.listingType,
  title: doc.title,
  description: doc.description,
  category: doc.category,
  subcategory: doc.subcategory,
  price: doc.price,
  quantity: doc.quantity,
  unit: doc.unit,
  images: normalizeListingImages(doc.images as unknown[]),
  district: doc.district,
  village: doc.village,
  taluka: doc.taluka,
  status: doc.status,
  views: doc.views,
  contactClicks: doc.contactClicks,
  expiresAt: doc.expiresAt,
  crop: doc.crop,
  harvestDate: doc.harvestDate,
  moisture: doc.moisture,
  expectedPrice: doc.expectedPrice,
  brand: doc.brand,
  stock: doc.stock,
  availableWorkers: doc.availableWorkers,
  gender: doc.gender,
  rateType: doc.rateType,
  availableFrom: doc.availableFrom,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const buildTextSearchQuery = (search: string): string =>
  search
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => `"${token.replace(/"/g, "")}"`)
    .join(" ");

const assertValidObjectId = (id: string, label = "id"): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const buildExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + LISTING_EXPIRY_DAYS);
  return expiresAt;
};

const fetchSellerInfo = async (sellerId: Types.ObjectId): Promise<SellerInfoDTO> => {
  const [profile, authUser] = await Promise.all([
    FarmerProfile.findOne({ userId: sellerId }),
    AuthUser.findById(sellerId),
  ]);

  if (!profile) {
    throw new AppError("Seller profile not found.", 404);
  }
  if (!authUser) {
    throw new AppError("Seller account not found.", 404);
  }

  return {
    name: profile.name,
    district: profile.district,
    phone: authUser.mobile,
  };
};

const buildBrowseMatchFilter = (
  query: ListingsQuery
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {
    status: "ACTIVE",
    expiresAt: { $gt: new Date() },
  };

  if (query.category) {
    filter["category"] = query.category;
  }

  if (query.listingType) {
    filter["listingType"] = query.listingType;
  }

  if (query.district) {
    const { district: canonicalDistrict } = resolveDistrict(query.district);
    filter["district"] = canonicalDistrict;
  }

  if (query.search) {
    const textQuery = buildTextSearchQuery(query.search);
    if (textQuery.length > 0) {
      filter["$text"] = { $search: textQuery };
    }
  }

  return filter;
};

const buildSortStage = (
  sort: ListingsQuery["sort"],
  userDistrict?: string
): Record<string, 1 | -1> => {
  const sortStage: Record<string, 1 | -1> = {};

  if (userDistrict) {
    sortStage["districtPriority"] = 1;
  }

  switch (sort) {
    case "price_low_to_high":
      sortStage["price"] = 1;
      break;
    case "price_high_to_low":
      sortStage["price"] = -1;
      break;
    case "newest":
    default:
      sortStage["createdAt"] = -1;
      break;
  }

  return sortStage;
};

const buildBrowsePipeline = (
  matchFilter: Record<string, unknown>,
  query: ListingsQuery,
  userDistrict?: string
): PipelineStage[] => {
  const pipeline: PipelineStage[] = [{ $match: matchFilter }];

  if (userDistrict) {
    pipeline.push({
      $addFields: {
        districtPriority: {
          $cond: {
            if: { $eq: ["$district", userDistrict] },
            then: 0,
            else: 1,
          },
        },
      },
    });
  }

  pipeline.push({ $sort: buildSortStage(query.sort, userDistrict) });
  pipeline.push({ $skip: (query.page - 1) * query.limit });
  pipeline.push({ $limit: query.limit });

  return pipeline;
};

const getUserDistrict = async (userId: string): Promise<string | undefined> => {
  const profile = await FarmerProfile.findOne({
    userId: new Types.ObjectId(userId),
  });
  return profile?.district;
};

const assertListingOwner = (
  listing: HydratedDocument<IMarketplaceListing>,
  userId: string
): void => {
  if (listing.sellerId.toString() !== userId) {
    throw new AppError("You are not authorized to modify this listing.", 403);
  }
};

const isListingExpired = (listing: Pick<IMarketplaceListing, "expiresAt">): boolean =>
  listing.expiresAt <= new Date();

const isListingPubliclyVisible = (
  listing: Pick<IMarketplaceListing, "status" | "expiresAt">
): boolean => listing.status === "ACTIVE" && !isListingExpired(listing);

const assertPublicListingAccess = (
  listing: HydratedDocument<IMarketplaceListing>
): void => {
  if (!isListingPubliclyVisible(listing)) {
    throw new AppError("Listing not found.", 404);
  }
};

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export const createListing = async (
  userId: string,
  data: CreateListingBody
): Promise<ListingResponseDTO> => {
  const profile = await getProfile(userId);

  if (!profile.district) {
    throw new AppError(
      "Your profile must include a district before creating a listing.",
      400
    );
  }

  if (data.listingType === "labour") {
    if (!profile.village || !profile.taluka) {
      throw new AppError(
        "Your profile must include village and taluka before creating a labour listing.",
        400
      );
    }

    const activeLabourCount = await MarketplaceListing.countDocuments({
      sellerId: new Types.ObjectId(userId),
      listingType: "labour",
      status: "ACTIVE",
    });

    if (activeLabourCount >= MAX_ACTIVE_LABOUR_LISTINGS) {
      throw new AppError(
        `You can have at most ${MAX_ACTIVE_LABOUR_LISTINGS} active labour listings.`,
        400
      );
    }
  }

  const listing = await MarketplaceListing.create({
    sellerId: new Types.ObjectId(userId),
    listingType: data.listingType,
    title: data.title,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory,
    price: data.price,
    quantity: data.quantity,
    unit: data.unit,
    images: toStoredListingImages(data.images ?? []),
    district: profile.district,
    village: data.listingType === "labour" ? profile.village : undefined,
    taluka: data.listingType === "labour" ? profile.taluka : undefined,
    status: "ACTIVE",
    views: 0,
    contactClicks: 0,
    expiresAt: buildExpiryDate(),
    crop: data.crop,
    harvestDate: data.harvestDate,
    moisture: data.moisture,
    expectedPrice: data.expectedPrice,
    brand: data.brand,
    stock: data.stock,
    availableWorkers: data.availableWorkers,
    gender: data.gender,
    rateType: data.rateType,
    availableFrom: data.availableFrom,
  });

  return toListingDTO(listing);
};

export const getListings = async (
  query: ListingsQuery,
  authenticatedUserId?: string
): Promise<PaginatedListingsDTO> => {
  const matchFilter = buildBrowseMatchFilter(query);
  const userDistrict = authenticatedUserId
    ? await getUserDistrict(authenticatedUserId)
    : undefined;

  const [total, listings] = await Promise.all([
    MarketplaceListing.countDocuments(matchFilter),
    MarketplaceListing.aggregate(
      buildBrowsePipeline(matchFilter, query, userDistrict)
    ),
  ]);

  return {
    listings: listings.map((doc) =>
      toListingDTO(doc as HydratedDocument<IMarketplaceListing>)
    ),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    },
  };
};

export const getListingById = async (
  listingId: string,
  authenticatedUserId?: string
): Promise<ListingDetailResponseDTO> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findById(listingId);

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  const isOwner =
    authenticatedUserId !== undefined &&
    listing.sellerId.toString() === authenticatedUserId;

  if (!isOwner) {
    assertPublicListingAccess(listing);
  }

  listing.views += 1;
  await listing.save();

  const seller = await fetchSellerInfo(listing.sellerId);

  return {
    ...toListingDTO(listing),
    seller,
  };
};

export const updateListing = async (
  userId: string,
  listingId: string,
  data: UpdateListingBody
): Promise<ListingResponseDTO> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  assertListingOwner(listing, userId);

  if (listing.status === "ARCHIVED") {
    throw new AppError("Archived listings cannot be updated.", 400);
  }

  if (listing.listingType === "labour") {
    if (data.category !== undefined) {
      if (!(LABOUR_CATEGORIES as readonly string[]).includes(data.category)) {
        throw new AppError(
          `category must be one of: ${LABOUR_CATEGORIES.join(", ")} for labour listings.`,
          400
        );
      }
    }

    if (data.description !== undefined && (!data.description || data.description.trim().length === 0)) {
      throw new AppError("description is required for labour listings.", 400);
    }

    if (data.images !== undefined) {
      if (data.images.length === 0) {
        throw new AppError("At least one image is required for labour listings.", 400);
      }
      if (data.images.length > MAX_LABOUR_LISTING_IMAGES) {
        throw new AppError(
          `Labour listings can have at most ${MAX_LABOUR_LISTING_IMAGES} images.`,
          400
        );
      }
    }
  }

  if (
    listing.listingType === "labour" &&
    listing.status !== "ACTIVE" &&
    data.status === "ACTIVE"
  ) {
    const activeLabourCount = await MarketplaceListing.countDocuments({
      sellerId: listing.sellerId,
      listingType: "labour",
      status: "ACTIVE",
      _id: { $ne: listing._id },
    });

    if (activeLabourCount >= MAX_ACTIVE_LABOUR_LISTINGS) {
      throw new AppError(
        `You can have at most ${MAX_ACTIVE_LABOUR_LISTINGS} active labour listings.`,
        400
      );
    }
  }

  const { images, ...rest } = data;
  Object.assign(listing, rest);

  if (images !== undefined) {
    listing.images = toStoredListingImages(images);
  }

  if (listing.listingType === "labour") {
    const workers = listing.availableWorkers ?? 1;
    listing.title = buildLabourTitle(listing.category, workers);
  }

  await listing.save();

  return toListingDTO(listing);
};

export const archiveListing = async (
  userId: string,
  listingId: string
): Promise<ListingResponseDTO> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  assertListingOwner(listing, userId);

  if (listing.status === "ARCHIVED") {
    throw new AppError("Listing is already archived.", 400);
  }

  listing.status = "ARCHIVED";
  await listing.save();

  return toListingDTO(listing);
};

export const getMyListings = async (
  userId: string,
  page: number,
  limit: number
): Promise<PaginatedListingsDTO> => {
  const filter = { sellerId: new Types.ObjectId(userId) };
  const skip = (page - 1) * limit;

  const [total, listings] = await Promise.all([
    MarketplaceListing.countDocuments(filter),
    MarketplaceListing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    listings: listings.map(toListingDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const saveListing = async (
  userId: string,
  listingId: string
): Promise<{ listingId: string; savedAt: Date }> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findById(listingId);
  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

  if (listing.sellerId.toString() === userId) {
    throw new AppError("You cannot save your own listing.", 400);
  }

  const existingSave = await MarketplaceSaved.findOne({
    userId: new Types.ObjectId(userId),
    listingId: new Types.ObjectId(listingId),
  });

  if (existingSave) {
    throw new AppError("Listing is already saved.", 409);
  }

  const saved = await MarketplaceSaved.create({
    userId: new Types.ObjectId(userId),
    listingId: new Types.ObjectId(listingId),
    savedAt: new Date(),
  });

  return {
    listingId: saved.listingId.toString(),
    savedAt: saved.savedAt,
  };
};

export const unsaveListing = async (
  userId: string,
  listingId: string
): Promise<{ listingId: string }> => {
  assertValidObjectId(listingId, "listing id");

  const result = await MarketplaceSaved.findOneAndDelete({
    userId: new Types.ObjectId(userId),
    listingId: new Types.ObjectId(listingId),
  });

  if (!result) {
    throw new AppError("Saved listing not found.", 404);
  }

  return { listingId };
};

export const getSavedListings = async (
  userId: string,
  page: number,
  limit: number
): Promise<SavedListingsDTO> => {
  const userObjectId = new Types.ObjectId(userId);
  const skip = (page - 1) * limit;
  const now = new Date();

  const [aggregationResult] = await MarketplaceSaved.aggregate<{
    metadata: { total: number }[];
    data: { listing: HydratedDocument<IMarketplaceListing> }[];
  }>([
    { $match: { userId: userObjectId } },
    {
      $lookup: {
        from: "marketplace",
        localField: "listingId",
        foreignField: "_id",
        as: "listing",
      },
    },
    { $unwind: "$listing" },
    {
      $match: {
        "listing.status": "ACTIVE",
        "listing.expiresAt": { $gt: now },
      },
    },
    { $sort: { savedAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const total = aggregationResult?.metadata[0]?.total ?? 0;
  const savedRecords = aggregationResult?.data ?? [];

  return {
    listings: savedRecords.map((record) => toListingDTO(record.listing)),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};

export const recordContactClick = async (listingId: string): Promise<void> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findByIdAndUpdate(
    listingId,
    { $inc: { contactClicks: 1 } }
  );

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }
};

/**
 * Returns owned-listing status counts plus publicly-visible saved count.
 * Uses countDocuments / aggregate count only — no listing payloads.
 */
export const getMyMarketplaceSummary = async (
  userId: string
): Promise<MyMarketplaceSummaryDTO> => {
  const sellerId = new Types.ObjectId(userId);
  const userObjectId = sellerId;
  const now = new Date();

  const [active, sold, archived, savedAggregation] = await Promise.all([
    MarketplaceListing.countDocuments({ sellerId, status: "ACTIVE" }),
    MarketplaceListing.countDocuments({ sellerId, status: "SOLD" }),
    MarketplaceListing.countDocuments({ sellerId, status: "ARCHIVED" }),
    MarketplaceSaved.aggregate<{ total: number }>([
      { $match: { userId: userObjectId } },
      {
        $lookup: {
          from: "marketplace",
          localField: "listingId",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: "$listing" },
      {
        $match: {
          "listing.status": "ACTIVE",
          "listing.expiresAt": { $gt: now },
        },
      },
      { $count: "total" },
    ]),
  ]);

  return {
    active,
    sold,
    archived,
    saved: savedAggregation[0]?.total ?? 0,
  };
};
