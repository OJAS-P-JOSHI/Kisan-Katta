import { api } from '@/services/api';

import { DEFAULT_LIMIT, DEFAULT_PAGE } from './marketplace.constants';
import type {
  CreateListingPayload,
  ListingDetailResponse,
  ListingImage,
  ListingResponse,
  ListingsQueryParams,
  PaginatedListings,
  PaginatedListingsResponse,
  SaveListingResponse,
  UnsaveListingResponse,
  UpdateListingPayload,
  UploadImagesResponse,
} from './marketplace.types';

const MARKETPLACE_BASE = '/api/v1/marketplace';

const LISTINGS_ENDPOINT = `${MARKETPLACE_BASE}/listings`;
const MY_LISTINGS_ENDPOINT = `${MARKETPLACE_BASE}/my-listings`;
const SAVED_LISTINGS_ENDPOINT = `${MARKETPLACE_BASE}/saved`;

/** Fetches paginated marketplace listings with optional filters. */
export const getListings = async (
  params: ListingsQueryParams = {},
): Promise<PaginatedListings> => {
  const response = await api.get<PaginatedListingsResponse>(LISTINGS_ENDPOINT, {
    params: {
      page: params.page ?? DEFAULT_PAGE,
      limit: params.limit ?? DEFAULT_LIMIT,
      sort: params.sort ?? 'newest',
      ...(params.search ? { search: params.search } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(params.listingType ? { listingType: params.listingType } : {}),
      ...(params.district ? { district: params.district } : {}),
    },
  });
  return response.data.data;
};

/** Fetches a single listing with seller details. */
export const getListingById = async (id: string) => {
  const response = await api.get<ListingDetailResponse>(`${LISTINGS_ENDPOINT}/${id}`);
  return response.data.data;
};

/** Creates a new marketplace listing. */
export const createListing = async (payload: CreateListingPayload) => {
  const response = await api.post<ListingResponse>(LISTINGS_ENDPOINT, payload);
  return response.data.data;
};

/** Updates an existing marketplace listing. */
export const updateListing = async (id: string, payload: UpdateListingPayload) => {
  const response = await api.put<ListingResponse>(`${LISTINGS_ENDPOINT}/${id}`, payload);
  return response.data.data;
};

/** Archives a marketplace listing. */
export const archiveListing = async (id: string) => {
  const response = await api.delete<ListingResponse>(`${LISTINGS_ENDPOINT}/${id}`);
  return response.data.data;
};

/** Fetches the authenticated user's listings. */
export const getMyListings = async (
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
): Promise<PaginatedListings> => {
  const response = await api.get<PaginatedListingsResponse>(MY_LISTINGS_ENDPOINT, {
    params: { page, limit },
  });
  return response.data.data;
};

/** Saves a listing for the authenticated user. */
export const saveListing = async (id: string) => {
  const response = await api.post<SaveListingResponse>(`${LISTINGS_ENDPOINT}/${id}/save`);
  return response.data.data;
};

/** Removes a saved listing for the authenticated user. */
export const unsaveListing = async (id: string) => {
  const response = await api.delete<UnsaveListingResponse>(`${LISTINGS_ENDPOINT}/${id}/save`);
  return response.data.data;
};

/** Fetches the authenticated user's saved listings. */
export const getSavedListings = async (
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
): Promise<PaginatedListings> => {
  const response = await api.get<PaginatedListingsResponse>(SAVED_LISTINGS_ENDPOINT, {
    params: { page, limit },
  });
  return response.data.data;
};

/** Records a seller contact click for analytics. */
export const recordContactClick = async (id: string): Promise<void> => {
  await api.post(`${LISTINGS_ENDPOINT}/${id}/contact`);
};

const IMAGES_UPLOAD_ENDPOINT = `${MARKETPLACE_BASE}/images/upload`;
const IMAGES_DELETE_ENDPOINT = `${MARKETPLACE_BASE}/images`;

/** Uploads a single local image file to Cloudinary via the backend. */
export const uploadMarketplaceImage = async (
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<ListingImage> => {
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

/** Deletes an uploaded marketplace image from Cloudinary. */
export const deleteMarketplaceImage = async (publicId: string): Promise<void> => {
  await api.delete(IMAGES_DELETE_ENDPOINT, { data: { publicId } });
};
