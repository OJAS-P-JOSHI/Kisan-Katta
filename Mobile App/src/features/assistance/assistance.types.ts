import type { ApiSuccessResponse, ID } from '@/types';

import type {
  HELP_REQUEST_SORT_OPTIONS,
  HELP_REQUEST_STATUSES,
  REPORT_REASONS,
} from './assistance.constants';

export type HelpRequestStatus = (typeof HELP_REQUEST_STATUSES)[number];
export type HelpRequestSortOption = (typeof HELP_REQUEST_SORT_OPTIONS)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];

export type HelpRequestImage = {
  url: string;
  publicId: string;
};

/**
 * Snapshot of the author taken when the request was published. Never re-render
 * this from the live profile — historical requests must stay accurate.
 */
export type HelpRequestAuthor = {
  userId: string;
  name: string;
  profilePhoto: string | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  verified: boolean;
};

export type HelpRequest = {
  id: ID;
  author: HelpRequestAuthor;
  title: string;
  description: string;
  images: HelpRequestImage[];
  status: HelpRequestStatus;
  supportCount: number;
  reportCount: number;
  hasSupported: boolean;
  hasReported: boolean;
  isOwner: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedHelpRequests = {
  requests: HelpRequest[];
  pagination: PaginationMeta;
};

export type HelpRequestsQueryParams = {
  search?: string;
  district?: string;
  status?: Extract<HelpRequestStatus, 'OPEN' | 'RESOLVED'>;
  page?: number;
  limit?: number;
  sort?: HelpRequestSortOption;
};

export type MyHelpRequestsQueryParams = {
  status?: HelpRequestStatus;
  page?: number;
  limit?: number;
};

export type CreateHelpRequestPayload = {
  title: string;
  description: string;
  images: HelpRequestImage[];
};

export type UpdateHelpRequestPayload = Partial<CreateHelpRequestPayload>;

export type ReportHelpRequestPayload = {
  reason: ReportReason;
  details?: string;
};

export type SupportHelpRequestResult = {
  requestId: string;
  supportCount: number;
  hasSupported: true;
};

export type ReportHelpRequestResult = {
  requestId: string;
  reportCount: number;
  hasReported: true;
};

export type DeleteHelpRequestResult = {
  id: string;
};

/** Counts behind the "My Assistance" card and the active-request gate. */
export type MyAssistanceSummary = {
  pendingReview: number;
  open: number;
  resolved: number;
  rejected: number;
  archived: number;
  activeCount: number;
  maxActive: number;
  canCreate: boolean;
};

export type UploadImagesResult = {
  images: HelpRequestImage[];
};

export type PaginatedHelpRequestsResponse = ApiSuccessResponse<PaginatedHelpRequests>;
export type HelpRequestResponse = ApiSuccessResponse<HelpRequest>;
export type SupportHelpRequestResponse = ApiSuccessResponse<SupportHelpRequestResult>;
export type ReportHelpRequestResponse = ApiSuccessResponse<ReportHelpRequestResult>;
export type DeleteHelpRequestResponse = ApiSuccessResponse<DeleteHelpRequestResult>;
export type MyAssistanceSummaryResponse = ApiSuccessResponse<MyAssistanceSummary>;
export type UploadImagesResponse = ApiSuccessResponse<UploadImagesResult>;
