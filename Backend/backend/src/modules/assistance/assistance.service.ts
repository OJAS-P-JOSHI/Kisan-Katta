import { Types } from "mongoose";
import { AppError } from "../../utils/AppError";
import { AuthUser } from "../auth/auth.model";
import { getProfile } from "../profile/profile.service";
import {
  ACTIVE_LIMIT_MESSAGE,
  AUTHOR_DEFAULT_STATE,
  EDITABLE_HELP_REQUEST_STATUSES,
  MAX_ACTIVE_HELP_REQUESTS,
  PUBLIC_HELP_REQUEST_STATUSES,
} from "./assistance.constants";
import { normalizeHelpRequestImages, toStoredHelpRequestImages } from "./assistance.image.utils";
import * as repository from "./assistance.repository";
import type { HelpRequestDoc } from "./assistance.repository";
import type {
  AdminHelpRequestDTO,
  AdminHelpRequestsQuery,
  CreateHelpRequestBody,
  HelpRequestResponseDTO,
  HelpRequestsQuery,
  IHelpRequestAuthor,
  ModerationBody,
  MyAssistanceSummaryDTO,
  MyHelpRequestsQuery,
  PaginatedAdminHelpRequestsDTO,
  PaginatedHelpRequestsDTO,
  PaginationDTO,
  ReportHelpRequestBody,
  ReportHelpRequestDTO,
  SupportHelpRequestDTO,
  UpdateHelpRequestBody,
  ViewerContext,
} from "./assistance.types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const OBJECT_ID_HEX = /^[a-fA-F0-9]{24}$/;

const assertValidObjectId = (id: string, label = "id"): void => {
  if (!OBJECT_ID_HEX.test(id)) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
};

const emptyViewer = (): ViewerContext => ({
  supportedIds: new Set<string>(),
  reportedIds: new Set<string>(),
});

/**
 * Resolves the viewer's support / report flags for a page of requests using a
 * single query per collection instead of one lookup per card.
 */
const buildViewerContext = async (
  docs: HelpRequestDoc[],
  viewerId?: string
): Promise<ViewerContext> => {
  if (!viewerId || docs.length === 0) {
    const viewer = emptyViewer();
    if (viewerId) viewer.userId = viewerId;
    return viewer;
  }

  const requestIds = docs.map((doc) => doc._id);
  const [supportedIds, reportedIds] = await Promise.all([
    repository.findSupportedRequestIds(viewerId, requestIds),
    repository.findReportedRequestIds(viewerId, requestIds),
  ]);

  return {
    userId: viewerId,
    supportedIds: new Set(supportedIds),
    reportedIds: new Set(reportedIds),
  };
};

const toAuthorDTO = (author: IHelpRequestAuthor) => ({
  userId: author.userId.toString(),
  name: author.name,
  profilePhoto: author.profilePhoto ?? null,
  village: author.village,
  taluka: author.taluka,
  district: author.district,
  state: author.state,
  verified: author.verified,
});

const toHelpRequestDTO = (
  doc: HelpRequestDoc,
  viewer: ViewerContext
): HelpRequestResponseDTO => {
  const id = doc._id.toString();

  return {
    id,
    author: toAuthorDTO(doc.author),
    title: doc.title,
    description: doc.description,
    images: normalizeHelpRequestImages(doc.images as unknown[]),
    status: doc.status,
    supportCount: doc.supportCount,
    reportCount: doc.reportCount,
    hasSupported: viewer.supportedIds.has(id),
    hasReported: viewer.reportedIds.has(id),
    isOwner: viewer.userId !== undefined && doc.author.userId.toString() === viewer.userId,
    resolvedAt: doc.resolvedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const toAdminHelpRequestDTO = (
  doc: HelpRequestDoc,
  viewer: ViewerContext
): AdminHelpRequestDTO => ({
  ...toHelpRequestDTO(doc, viewer),
  moderationNote: doc.moderationNote ?? null,
  reviewedAt: doc.reviewedAt ?? null,
  reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : null,
  isDeleted: doc.isDeleted,
});

const toPagination = (
  page: number,
  limit: number,
  total: number
): PaginationDTO => ({
  page,
  limit,
  total,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

const isPubliclyVisible = (doc: HelpRequestDoc): boolean =>
  (PUBLIC_HELP_REQUEST_STATUSES as readonly string[]).includes(doc.status);

const assertOwner = (doc: HelpRequestDoc, userId: string): void => {
  if (doc.author.userId.toString() !== userId) {
    throw new AppError("You are not authorized to modify this help request.", 403);
  }
};

/**
 * Every field except title, description, and proof photos is copied from the
 * verified profile at publish time and frozen on the request.
 */
const buildAuthorSnapshot = async (userId: string): Promise<IHelpRequestAuthor> => {
  const [profile, authUser] = await Promise.all([
    getProfile(userId),
    AuthUser.findById(userId).select("isVerified").lean(),
  ]);

  if (!authUser) {
    throw new AppError("User account no longer exists.", 401);
  }

  if (!authUser.isVerified) {
    throw new AppError(
      "Only verified farmers can publish a help request. Please verify your account first.",
      403
    );
  }

  return {
    userId: new Types.ObjectId(userId),
    name: profile.name,
    profilePhoto: profile.profileImage?.url ?? null,
    village: profile.village,
    taluka: profile.taluka,
    district: profile.district,
    state: AUTHOR_DEFAULT_STATE,
    verified: true,
  };
};

const loadVisibleRequest = async (
  requestId: string,
  viewerId?: string
): Promise<HelpRequestDoc> => {
  assertValidObjectId(requestId, "help request id");

  const doc = await repository.findHelpRequestById(requestId);
  if (!doc) {
    throw new AppError("Help request not found.", 404);
  }

  const isOwner = viewerId !== undefined && doc.author.userId.toString() === viewerId;
  if (!isOwner && !isPubliclyVisible(doc)) {
    // Pending, rejected, and archived requests are invisible to everyone else.
    throw new AppError("Help request not found.", 404);
  }

  return doc;
};

// ---------------------------------------------------------------------------
// Farmer-facing service functions
// ---------------------------------------------------------------------------

export const createHelpRequest = async (
  userId: string,
  data: CreateHelpRequestBody
): Promise<HelpRequestResponseDTO> => {
  const author = await buildAuthorSnapshot(userId);

  const activeCount = await repository.countActiveByAuthor(author.userId);
  if (activeCount >= MAX_ACTIVE_HELP_REQUESTS) {
    throw new AppError(ACTIVE_LIMIT_MESSAGE, 409);
  }

  const doc = await repository.insertHelpRequest({
    author,
    title: data.title,
    description: data.description,
    images: toStoredHelpRequestImages(data.images),
  });

  // Close the TOCTOU window: concurrent creates can both pass the pre-check.
  // If we overshot the quota, soft-delete this insert and reject.
  const activeAfterInsert = await repository.countActiveByAuthor(author.userId);
  if (activeAfterInsert > MAX_ACTIVE_HELP_REQUESTS) {
    await repository.softDeleteHelpRequest(doc._id.toString());
    throw new AppError(ACTIVE_LIMIT_MESSAGE, 409);
  }

  const viewer = emptyViewer();
  viewer.userId = userId;

  return toHelpRequestDTO(doc, viewer);
};

export const getHelpRequests = async (
  query: HelpRequestsQuery,
  viewerId?: string
): Promise<PaginatedHelpRequestsDTO> => {
  const filter: repository.HelpRequestListFilter = {
    statuses: query.status ? [query.status] : PUBLIC_HELP_REQUEST_STATUSES,
  };
  if (query.district) filter.district = query.district;
  if (query.search) filter.search = query.search;

  const { items, total } = await repository.findHelpRequestPage(
    filter,
    { page: query.page, limit: query.limit },
    query.sort
  );

  const viewer = await buildViewerContext(items, viewerId);

  return {
    requests: items.map((doc) => toHelpRequestDTO(doc, viewer)),
    pagination: toPagination(query.page, query.limit, total),
  };
};

export const getHelpRequestById = async (
  requestId: string,
  viewerId?: string
): Promise<HelpRequestResponseDTO> => {
  const doc = await loadVisibleRequest(requestId, viewerId);
  const viewer = await buildViewerContext([doc], viewerId);
  return toHelpRequestDTO(doc, viewer);
};

export const updateHelpRequest = async (
  userId: string,
  requestId: string,
  data: UpdateHelpRequestBody
): Promise<HelpRequestResponseDTO> => {
  assertValidObjectId(requestId, "help request id");

  const existing = await repository.findHelpRequestById(requestId);
  if (!existing) {
    throw new AppError("Help request not found.", 404);
  }

  assertOwner(existing, userId);

  if (!(EDITABLE_HELP_REQUEST_STATUSES as readonly string[]).includes(existing.status)) {
    throw new AppError(
      "Only requests that are pending review or open can be edited.",
      400
    );
  }

  const $set: Record<string, unknown> = {};
  if (data.title !== undefined) $set["title"] = data.title;
  if (data.description !== undefined) $set["description"] = data.description;
  if (data.images !== undefined) {
    $set["images"] = toStoredHelpRequestImages(data.images);
  }

  const updated = await repository.updateHelpRequestById(requestId, { $set });
  if (!updated) {
    throw new AppError("Help request not found.", 404);
  }

  const viewer = await buildViewerContext([updated], userId);
  return toHelpRequestDTO(updated, viewer);
};

export const resolveHelpRequest = async (
  userId: string,
  requestId: string
): Promise<HelpRequestResponseDTO> => {
  assertValidObjectId(requestId, "help request id");

  const existing = await repository.findHelpRequestById(requestId);
  if (!existing) {
    throw new AppError("Help request not found.", 404);
  }

  assertOwner(existing, userId);

  const updated = await repository.updateHelpRequestStatus(
    requestId,
    ["PENDING_REVIEW", "OPEN"],
    { $set: { status: "RESOLVED", resolvedAt: new Date() } }
  );

  if (!updated) {
    throw new AppError("Only pending or open requests can be resolved.", 400);
  }

  const viewer = await buildViewerContext([updated], userId);
  return toHelpRequestDTO(updated, viewer);
};

export const deleteHelpRequest = async (
  userId: string,
  requestId: string
): Promise<{ id: string }> => {
  assertValidObjectId(requestId, "help request id");

  const existing = await repository.findHelpRequestById(requestId);
  if (!existing) {
    throw new AppError("Help request not found.", 404);
  }

  assertOwner(existing, userId);

  const deleted = await repository.softDeleteHelpRequest(requestId);
  if (!deleted) {
    throw new AppError("Help request not found.", 404);
  }

  return { id: deleted._id.toString() };
};

/** Support means "I stand with this farmer" — never money. Only OPEN requests. */
export const supportHelpRequest = async (
  userId: string,
  requestId: string
): Promise<SupportHelpRequestDTO> => {
  const doc = await loadVisibleRequest(requestId, userId);

  if (doc.author.userId.toString() === userId) {
    throw new AppError("You cannot support your own help request.", 400);
  }

  if (doc.status !== "OPEN") {
    throw new AppError("Only open help requests can be supported.", 400);
  }

  const inserted = await repository.insertSupport(requestId, userId);
  if (!inserted) {
    throw new AppError("You have already supported this help request.", 409);
  }

  const updated = await repository.incrementSupportCount(requestId);
  if (!updated) {
    await repository.deleteSupport(requestId, userId);
    throw new AppError("Help request not found.", 404);
  }

  return {
    requestId,
    supportCount: updated.supportCount,
    hasSupported: true,
  };
};

export const reportHelpRequest = async (
  userId: string,
  requestId: string,
  data: ReportHelpRequestBody
): Promise<ReportHelpRequestDTO> => {
  const doc = await loadVisibleRequest(requestId, userId);

  if (doc.author.userId.toString() === userId) {
    throw new AppError("You cannot report your own help request.", 400);
  }

  const inserted = await repository.insertReport(
    requestId,
    userId,
    data.reason,
    data.details ?? null
  );

  if (!inserted) {
    throw new AppError("You have already reported this help request.", 409);
  }

  const updated = await repository.incrementReportCount(requestId);
  if (!updated) {
    await repository.deleteReport(requestId, userId);
    throw new AppError("Help request not found.", 404);
  }

  return {
    requestId,
    reportCount: updated.reportCount,
    hasReported: true,
  };
};

export const getMyHelpRequests = async (
  userId: string,
  query: MyHelpRequestsQuery
): Promise<PaginatedHelpRequestsDTO> => {
  const filter: repository.HelpRequestListFilter = {
    authorId: new Types.ObjectId(userId),
  };
  if (query.status) filter.statuses = [query.status];

  const { items, total } = await repository.findHelpRequestPage(filter, {
    page: query.page,
    limit: query.limit,
  });

  const viewer = await buildViewerContext(items, userId);

  return {
    requests: items.map((doc) => toHelpRequestDTO(doc, viewer)),
    pagination: toPagination(query.page, query.limit, total),
  };
};

/** Drives the "My Assistance" card and the client-side create gate. */
export const getMyAssistanceSummary = async (
  userId: string
): Promise<MyAssistanceSummaryDTO> => {
  const counts = await repository.aggregateAuthorStatusCounts(
    new Types.ObjectId(userId)
  );

  const byStatus = new Map(counts.map((row) => [row._id, row.count]));
  const pendingReview = byStatus.get("PENDING_REVIEW") ?? 0;
  const open = byStatus.get("OPEN") ?? 0;
  const activeCount = pendingReview + open;

  return {
    pendingReview,
    open,
    resolved: byStatus.get("RESOLVED") ?? 0,
    rejected: byStatus.get("REJECTED") ?? 0,
    archived: byStatus.get("ARCHIVED") ?? 0,
    activeCount,
    maxActive: MAX_ACTIVE_HELP_REQUESTS,
    canCreate: activeCount < MAX_ACTIVE_HELP_REQUESTS,
  };
};

// ---------------------------------------------------------------------------
// Admin moderation service functions
// ---------------------------------------------------------------------------

export const listHelpRequestsForAdmin = async (
  query: AdminHelpRequestsQuery
): Promise<PaginatedAdminHelpRequestsDTO> => {
  const filter: repository.HelpRequestListFilter = {};
  if (query.status) filter.statuses = [query.status];
  if (query.district) filter.district = query.district;
  if (query.search) filter.search = query.search;

  const { items, total } = await repository.findHelpRequestPage(filter, {
    page: query.page,
    limit: query.limit,
  });

  const viewer = emptyViewer();

  return {
    requests: items.map((doc) => toAdminHelpRequestDTO(doc, viewer)),
    pagination: toPagination(query.page, query.limit, total),
  };
};

const moderate = async (
  requestId: string,
  adminId: string,
  fromStatuses: readonly ("PENDING_REVIEW" | "OPEN" | "RESOLVED" | "REJECTED")[],
  nextStatus: "OPEN" | "REJECTED" | "ARCHIVED",
  note: string | undefined,
  conflictMessage: string
): Promise<AdminHelpRequestDTO> => {
  assertValidObjectId(requestId, "help request id");

  const $set: Record<string, unknown> = {
    status: nextStatus,
    reviewedAt: new Date(),
    reviewedBy: new Types.ObjectId(adminId),
  };
  if (note !== undefined) $set["moderationNote"] = note;

  const updated = await repository.updateHelpRequestStatus(requestId, fromStatuses, {
    $set,
  });

  if (!updated) {
    const exists = await repository.findHelpRequestByIdIncludingDeleted(requestId);
    throw new AppError(exists ? conflictMessage : "Help request not found.", exists ? 409 : 404);
  }

  return toAdminHelpRequestDTO(updated, emptyViewer());
};

/** Pending Review → Open. This is the only path to public visibility. */
export const approveHelpRequest = (
  requestId: string,
  adminId: string,
  data: ModerationBody
): Promise<AdminHelpRequestDTO> =>
  moderate(
    requestId,
    adminId,
    ["PENDING_REVIEW"],
    "OPEN",
    data.note,
    "Only requests pending review can be approved."
  );

export const rejectHelpRequest = (
  requestId: string,
  adminId: string,
  data: ModerationBody
): Promise<AdminHelpRequestDTO> =>
  moderate(
    requestId,
    adminId,
    ["PENDING_REVIEW", "OPEN"],
    "REJECTED",
    data.note,
    "Only pending or open requests can be rejected."
  );

export const archiveHelpRequest = (
  requestId: string,
  adminId: string,
  data: ModerationBody
): Promise<AdminHelpRequestDTO> =>
  moderate(
    requestId,
    adminId,
    ["PENDING_REVIEW", "OPEN", "RESOLVED", "REJECTED"],
    "ARCHIVED",
    data.note,
    "This help request is already archived."
  );
