import { Types } from "mongoose";
import type { HydratedDocument, PipelineStage } from "mongoose";
import { AppError } from "../../utils/AppError";
import { resolveDistrict } from "../../config/maharashtraDistrictCoordinates";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { getProfile } from "../profile/profile.service";
import { LISTING_EXPIRY_DAYS } from "./marketplace.constants";
import { MarketplaceListing, MarketplaceSaved } from "./marketplace.model";
import type {
  CreateListingBody,
  IMarketplaceListing,
  ListingDetailResponseDTO,
  ListingResponseDTO,
  ListingsQuery,
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
  images: doc.images,
  district: doc.district,
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
    images: data.images ?? [],
    district: profile.district,
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
  listingId: string
): Promise<ListingDetailResponseDTO> => {
  assertValidObjectId(listingId, "listing id");

  const listing = await MarketplaceListing.findByIdAndUpdate(
    listingId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!listing) {
    throw new AppError("Listing not found.", 404);
  }

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

  Object.assign(listing, data);
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

  const [total, savedRecords] = await Promise.all([
    MarketplaceSaved.countDocuments({ userId: userObjectId }),
    MarketplaceSaved.find({ userId: userObjectId })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const listingIds = savedRecords.map((record) => record.listingId);
  const listings = await MarketplaceListing.find({ _id: { $in: listingIds } });
  const listingMap = new Map(listings.map((listing) => [listing._id.toString(), listing]));

  const orderedListings = savedRecords
    .map((record) => listingMap.get(record.listingId.toString()))
    .filter((listing): listing is HydratedDocument<IMarketplaceListing> => listing !== undefined);

  return {
    listings: orderedListings.map(toListingDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
};
