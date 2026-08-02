import { Types } from "mongoose";
import type { HydratedDocument, QueryFilter, UpdateQuery } from "mongoose";
import { ACTIVE_HELP_REQUEST_STATUSES } from "./assistance.constants";
import {
  HelpRequest,
  HelpRequestReport,
  HelpRequestSupport,
} from "./assistance.model";
import type {
  HelpRequestSortOption,
  HelpRequestStatus,
  IHelpRequest,
  IHelpRequestReport,
  IHelpRequestSupport,
  NewHelpRequestInput,
  ReportReason,
} from "./assistance.types";

export type HelpRequestDoc = HydratedDocument<IHelpRequest>;

export interface HelpRequestListFilter {
  /** Statuses to include. Empty means "all statuses". */
  statuses?: readonly HelpRequestStatus[];
  district?: string;
  search?: string;
  authorId?: Types.ObjectId;
}

export interface PageOptions {
  page: number;
  limit: number;
}

export interface PagedHelpRequests {
  items: HelpRequestDoc[];
  total: number;
}

// ---------------------------------------------------------------------------
// Internal query builders
// ---------------------------------------------------------------------------

const buildTextSearchQuery = (search: string): string =>
  search
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => `"${token.replace(/"/g, "")}"`)
    .join(" ");

const buildFilter = (filter: HelpRequestListFilter): QueryFilter<IHelpRequest> => {
  // Soft deletes are the only delete mode — deleted rows never leave the DB.
  const query: QueryFilter<IHelpRequest> = { isDeleted: false };

  if (filter.statuses && filter.statuses.length > 0) {
    query.status = { $in: [...filter.statuses] };
  }

  if (filter.district) {
    query["author.district"] = filter.district;
  }

  if (filter.authorId) {
    query["author.userId"] = filter.authorId;
  }

  if (filter.search) {
    const textQuery = buildTextSearchQuery(filter.search);
    if (textQuery.length > 0) {
      query.$text = { $search: textQuery };
    }
  }

  return query;
};

const buildSort = (sort: HelpRequestSortOption): Record<string, 1 | -1> => {
  if (sort === "most_supported") {
    return { supportCount: -1, createdAt: -1 };
  }
  return { createdAt: -1 };
};

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === 11000;

// ---------------------------------------------------------------------------
// Help request reads
// ---------------------------------------------------------------------------

export const findHelpRequestById = (
  requestId: string
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOne({ _id: new Types.ObjectId(requestId), isDeleted: false });

/** Admin lookup — soft-deleted rows remain visible for moderation history. */
export const findHelpRequestByIdIncludingDeleted = (
  requestId: string
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findById(new Types.ObjectId(requestId));

export const countActiveByAuthor = (authorId: Types.ObjectId): Promise<number> =>
  HelpRequest.countDocuments({
    "author.userId": authorId,
    status: { $in: [...ACTIVE_HELP_REQUEST_STATUSES] },
    isDeleted: false,
  });

export const findHelpRequestPage = async (
  filter: HelpRequestListFilter,
  options: PageOptions,
  sort: HelpRequestSortOption = "newest"
): Promise<PagedHelpRequests> => {
  const query = buildFilter(filter);
  const skip = (options.page - 1) * options.limit;

  const [total, items] = await Promise.all([
    HelpRequest.countDocuments(query),
    HelpRequest.find(query).sort(buildSort(sort)).skip(skip).limit(options.limit),
  ]);

  return { items, total };
};

export const aggregateAuthorStatusCounts = (
  authorId: Types.ObjectId
): Promise<{ _id: HelpRequestStatus; count: number }[]> =>
  HelpRequest.aggregate<{ _id: HelpRequestStatus; count: number }>([
    { $match: { "author.userId": authorId, isDeleted: false } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

// ---------------------------------------------------------------------------
// Help request writes
// ---------------------------------------------------------------------------

export const insertHelpRequest = (
  input: NewHelpRequestInput
): Promise<HelpRequestDoc> =>
  HelpRequest.create({
    author: input.author,
    title: input.title,
    description: input.description,
    images: input.images,
    // Public immediately — farmers must see each other's requests without an
    // admin gate. Admins can still reject / archive abusive posts.
    status: "OPEN",
    supportCount: 0,
    reportCount: 0,
    isDeleted: false,
    reviewedAt: new Date(),
    moderationNote: "Auto-published on create",
  });

export const updateHelpRequestById = (
  requestId: string,
  update: UpdateQuery<IHelpRequest>
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOneAndUpdate(
    { _id: new Types.ObjectId(requestId), isDeleted: false },
    update,
    { returnDocument: "after", runValidators: true }
  );

/**
 * Atomic status transition. Returns null when the request no longer sits in one
 * of `fromStatuses`, which keeps concurrent moderation actions safe.
 */
export const updateHelpRequestStatus = (
  requestId: string,
  fromStatuses: readonly HelpRequestStatus[],
  update: UpdateQuery<IHelpRequest>
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOneAndUpdate(
    {
      _id: new Types.ObjectId(requestId),
      isDeleted: false,
      status: { $in: [...fromStatuses] },
    },
    update,
    { returnDocument: "after", runValidators: true }
  );

export const softDeleteHelpRequest = (
  requestId: string
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOneAndUpdate(
    { _id: new Types.ObjectId(requestId), isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { returnDocument: "after" }
  );

export const incrementSupportCount = (
  requestId: string
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOneAndUpdate(
    { _id: new Types.ObjectId(requestId), isDeleted: false },
    { $inc: { supportCount: 1 } },
    { returnDocument: "after" }
  );

export const incrementReportCount = (
  requestId: string
): Promise<HelpRequestDoc | null> =>
  HelpRequest.findOneAndUpdate(
    { _id: new Types.ObjectId(requestId), isDeleted: false },
    { $inc: { reportCount: 1 } },
    { returnDocument: "after" }
  );

// ---------------------------------------------------------------------------
// Support records
// ---------------------------------------------------------------------------

/** Returns false when the user already supported the request. */
export const insertSupport = async (
  requestId: string,
  userId: string
): Promise<boolean> => {
  try {
    await HelpRequestSupport.create({
      requestId: new Types.ObjectId(requestId),
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }
    throw error;
  }
};

export const deleteSupport = (
  requestId: string,
  userId: string
): Promise<{ deletedCount?: number }> =>
  HelpRequestSupport.deleteOne({
    requestId: new Types.ObjectId(requestId),
    userId: new Types.ObjectId(userId),
  });

export const findSupport = (
  requestId: string,
  userId: string
): Promise<IHelpRequestSupport | null> =>
  HelpRequestSupport.findOne({
    requestId: new Types.ObjectId(requestId),
    userId: new Types.ObjectId(userId),
  }).lean();

/** One query resolves the viewer's support flags for a whole page of results. */
export const findSupportedRequestIds = async (
  userId: string,
  requestIds: Types.ObjectId[]
): Promise<string[]> => {
  if (requestIds.length === 0) return [];

  const supports = await HelpRequestSupport.find({
    userId: new Types.ObjectId(userId),
    requestId: { $in: requestIds },
  })
    .select("requestId")
    .lean();

  return supports.map((support) => support.requestId.toString());
};

// ---------------------------------------------------------------------------
// Report records
// ---------------------------------------------------------------------------

/** Returns false when the user already reported the request. */
export const insertReport = async (
  requestId: string,
  userId: string,
  reason: ReportReason,
  details: string | null
): Promise<boolean> => {
  try {
    await HelpRequestReport.create({
      requestId: new Types.ObjectId(requestId),
      userId: new Types.ObjectId(userId),
      reason,
      details,
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }
    throw error;
  }
};

export const deleteReport = (
  requestId: string,
  userId: string
): Promise<{ deletedCount?: number }> =>
  HelpRequestReport.deleteOne({
    requestId: new Types.ObjectId(requestId),
    userId: new Types.ObjectId(userId),
  });

export const findReport = (
  requestId: string,
  userId: string
): Promise<IHelpRequestReport | null> =>
  HelpRequestReport.findOne({
    requestId: new Types.ObjectId(requestId),
    userId: new Types.ObjectId(userId),
  }).lean();

export const findReportedRequestIds = async (
  userId: string,
  requestIds: Types.ObjectId[]
): Promise<string[]> => {
  if (requestIds.length === 0) return [];

  const reports = await HelpRequestReport.find({
    userId: new Types.ObjectId(userId),
    requestId: { $in: requestIds },
  })
    .select("requestId")
    .lean();

  return reports.map((report) => report.requestId.toString());
};
