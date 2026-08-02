import { Types } from "mongoose";
import type {
  HELP_REQUEST_SORT_OPTIONS,
  HELP_REQUEST_STATUSES,
  REPORT_REASONS,
} from "./assistance.constants";

// ---------------------------------------------------------------------------
// Enums (derived from constants)
// ---------------------------------------------------------------------------

export type HelpRequestStatus = (typeof HELP_REQUEST_STATUSES)[number];
export type HelpRequestSortOption = (typeof HELP_REQUEST_SORT_OPTIONS)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];

// ---------------------------------------------------------------------------
// Image shapes
// ---------------------------------------------------------------------------

export interface HelpRequestImage {
  url: string;
  publicId: string;
}

export interface UploadImagesResponseDTO {
  images: HelpRequestImage[];
}

export interface DeleteImageBody {
  publicId: string;
}

// ---------------------------------------------------------------------------
// Mongoose document interfaces
// ---------------------------------------------------------------------------

/**
 * Immutable copy of the author's profile at publish time. Requests are never
 * re-joined against the live profile so historical cards stay accurate after
 * the farmer edits their profile.
 */
export interface IHelpRequestAuthor {
  userId: Types.ObjectId;
  name: string;
  profilePhoto: string | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  verified: boolean;
}

export interface IHelpRequest {
  author: IHelpRequestAuthor;
  title: string;
  description: string;
  images: HelpRequestImage[];
  status: HelpRequestStatus;
  supportCount: number;
  reportCount: number;
  isDeleted: boolean;
  deletedAt: Date | null;
  /** Set when an admin approves / rejects / archives the request. */
  reviewedAt: Date | null;
  reviewedBy: Types.ObjectId | null;
  moderationNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHelpRequestSupport {
  requestId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export interface IHelpRequestReport {
  requestId: Types.ObjectId;
  userId: Types.ObjectId;
  reason: ReportReason;
  details: string | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Request body shapes
// ---------------------------------------------------------------------------

export interface CreateHelpRequestBody {
  title: string;
  description: string;
  images: HelpRequestImage[];
}

export interface UpdateHelpRequestBody {
  title?: string;
  description?: string;
  images?: HelpRequestImage[];
}

export interface ReportHelpRequestBody {
  reason: ReportReason;
  details?: string;
}

export interface ModerationBody {
  note?: string;
}

// ---------------------------------------------------------------------------
// Query shapes
// ---------------------------------------------------------------------------

export interface HelpRequestsQuery {
  search?: string;
  district?: string;
  status?: HelpRequestStatus;
  page: number;
  limit: number;
  sort: HelpRequestSortOption;
}

export interface MyHelpRequestsQuery {
  status?: HelpRequestStatus;
  page: number;
  limit: number;
}

export interface AdminHelpRequestsQuery {
  search?: string;
  district?: string;
  status?: HelpRequestStatus;
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Response DTOs
// ---------------------------------------------------------------------------

export interface HelpRequestAuthorDTO {
  userId: string;
  name: string;
  profilePhoto: string | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  verified: boolean;
}

export interface HelpRequestResponseDTO {
  id: string;
  author: HelpRequestAuthorDTO;
  title: string;
  description: string;
  images: HelpRequestImage[];
  status: HelpRequestStatus;
  supportCount: number;
  reportCount: number;
  /** True when the requesting user already supported this request. */
  hasSupported: boolean;
  /** True when the requesting user already reported this request. */
  hasReported: boolean;
  isOwner: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedHelpRequestsDTO {
  requests: HelpRequestResponseDTO[];
  pagination: PaginationDTO;
}

export interface SupportHelpRequestDTO {
  requestId: string;
  supportCount: number;
  hasSupported: true;
}

export interface ReportHelpRequestDTO {
  requestId: string;
  reportCount: number;
  hasReported: true;
}

/** Counts for the "My Assistance" summary and the create-request gate. */
export interface MyAssistanceSummaryDTO {
  pendingReview: number;
  open: number;
  resolved: number;
  rejected: number;
  archived: number;
  activeCount: number;
  maxActive: number;
  canCreate: boolean;
}

/** Admin moderation row — includes reviewer metadata hidden from farmers. */
export interface AdminHelpRequestDTO extends HelpRequestResponseDTO {
  moderationNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  isDeleted: boolean;
}

export interface PaginatedAdminHelpRequestsDTO {
  requests: AdminHelpRequestDTO[];
  pagination: PaginationDTO;
}

// ---------------------------------------------------------------------------
// Internal service inputs
// ---------------------------------------------------------------------------

export interface NewHelpRequestInput {
  author: IHelpRequestAuthor;
  title: string;
  description: string;
  images: HelpRequestImage[];
}

/** Per-viewer flags resolved in one batch query per page of results. */
export interface ViewerContext {
  userId?: string;
  supportedIds: Set<string>;
  reportedIds: Set<string>;
}
