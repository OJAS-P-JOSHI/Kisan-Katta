import { api } from '@/services/api';

import { DEFAULT_LIMIT, DEFAULT_PAGE } from './assistance.constants';
import type {
  CreateHelpRequestPayload,
  DeleteHelpRequestResponse,
  DeleteHelpRequestResult,
  HelpRequest,
  HelpRequestImage,
  HelpRequestResponse,
  HelpRequestsQueryParams,
  MyAssistanceSummary,
  MyAssistanceSummaryResponse,
  MyHelpRequestsQueryParams,
  PaginatedHelpRequests,
  PaginatedHelpRequestsResponse,
  ReportHelpRequestPayload,
  ReportHelpRequestResponse,
  ReportHelpRequestResult,
  SupportHelpRequestResponse,
  SupportHelpRequestResult,
  UpdateHelpRequestPayload,
  UploadImagesResponse,
} from './assistance.types';

const ASSISTANCE_BASE = '/api/v1/assistance';

const MY_REQUESTS_ENDPOINT = `${ASSISTANCE_BASE}/my-assistance`;
const MY_SUMMARY_ENDPOINT = `${ASSISTANCE_BASE}/my-summary`;
const IMAGES_UPLOAD_ENDPOINT = `${ASSISTANCE_BASE}/images/upload`;
const IMAGES_DELETE_ENDPOINT = `${ASSISTANCE_BASE}/images`;

/** Fetches the paginated public assistance feed. */
export const getHelpRequests = async (
  params: HelpRequestsQueryParams = {},
): Promise<PaginatedHelpRequests> => {
  const response = await api.get<PaginatedHelpRequestsResponse>(ASSISTANCE_BASE, {
    params: {
      page: params.page ?? DEFAULT_PAGE,
      limit: params.limit ?? DEFAULT_LIMIT,
      sort: params.sort ?? 'newest',
      ...(params.search ? { search: params.search } : {}),
      ...(params.district ? { district: params.district } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return response.data.data;
};

/** Fetches a single help request. Owners also see non-public statuses. */
export const getHelpRequestById = async (id: string): Promise<HelpRequest> => {
  const response = await api.get<HelpRequestResponse>(`${ASSISTANCE_BASE}/${id}`);
  return response.data.data;
};

/** Publishes a new help request as OPEN for the public feed. */
export const createHelpRequest = async (
  payload: CreateHelpRequestPayload,
): Promise<HelpRequest> => {
  const response = await api.post<HelpRequestResponse>(ASSISTANCE_BASE, payload);
  return response.data.data;
};

/** Updates an owned help request while it is pending review or open. */
export const updateHelpRequest = async (
  id: string,
  payload: UpdateHelpRequestPayload,
): Promise<HelpRequest> => {
  const response = await api.patch<HelpRequestResponse>(
    `${ASSISTANCE_BASE}/${id}`,
    payload,
  );
  return response.data.data;
};

/** Marks an owned help request resolved, freeing an active slot. */
export const resolveHelpRequest = async (id: string): Promise<HelpRequest> => {
  const response = await api.patch<HelpRequestResponse>(
    `${ASSISTANCE_BASE}/${id}/resolve`,
  );
  return response.data.data;
};

/** Soft-deletes an owned help request. */
export const deleteHelpRequest = async (
  id: string,
): Promise<DeleteHelpRequestResult> => {
  const response = await api.delete<DeleteHelpRequestResponse>(
    `${ASSISTANCE_BASE}/${id}`,
  );
  return response.data.data;
};

/** Records "I support this farmer" — never a payment. One per user. */
export const supportHelpRequest = async (
  id: string,
): Promise<SupportHelpRequestResult> => {
  const response = await api.post<SupportHelpRequestResponse>(
    `${ASSISTANCE_BASE}/${id}/support`,
  );
  return response.data.data;
};

/** Reports a help request. One report per user. */
export const reportHelpRequest = async (
  id: string,
  payload: ReportHelpRequestPayload,
): Promise<ReportHelpRequestResult> => {
  const response = await api.post<ReportHelpRequestResponse>(
    `${ASSISTANCE_BASE}/${id}/report`,
    payload,
  );
  return response.data.data;
};

/** Fetches the authenticated farmer's own requests, any status. */
export const getMyHelpRequests = async (
  params: MyHelpRequestsQueryParams = {},
): Promise<PaginatedHelpRequests> => {
  const response = await api.get<PaginatedHelpRequestsResponse>(MY_REQUESTS_ENDPOINT, {
    params: {
      page: params.page ?? DEFAULT_PAGE,
      limit: params.limit ?? DEFAULT_LIMIT,
      ...(params.status ? { status: params.status } : {}),
    },
  });
  return response.data.data;
};

/** Fetches status counts plus the active-request gate. */
export const getMyAssistanceSummary = async (): Promise<MyAssistanceSummary> => {
  const response = await api.get<MyAssistanceSummaryResponse>(MY_SUMMARY_ENDPOINT);
  return response.data.data;
};

/** Uploads a single compressed proof photo to Cloudinary via the backend. */
export const uploadAssistanceImage = async (
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<HelpRequestImage> => {
  const formData = new FormData();
  formData.append('images', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const response = await api.post<UploadImagesResponse>(
    IMAGES_UPLOAD_ENDPOINT,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    },
  );

  const uploaded = response.data.data.images[0];
  if (!uploaded) {
    throw new Error('Image upload returned no data.');
  }
  return uploaded;
};

/** Deletes an uploaded proof photo from Cloudinary. */
export const deleteAssistanceImage = async (publicId: string): Promise<void> => {
  await api.delete(IMAGES_DELETE_ENDPOINT, { data: { publicId } });
};
