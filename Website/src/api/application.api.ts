import type { AxiosProgressEvent } from 'axios'

import { api } from '@/api/axios'
import type { ApiSuccessResponse } from '@/types/auth.types'
import type {
  ApplicationDTO,
  ApplicationStatusDTO,
  DocumentType,
  UpdateApplicationBody,
  UploadDocumentResponse,
} from '@/types/application.types'

/**
 * Gram Sahakari application API. Consumes ONLY the existing backend endpoints
 * under `/api/v1/gram-sahakari`. All calls go through the shared `api` instance
 * (Bearer token attached by the request interceptor).
 */
const ENDPOINTS = {
  start: '/api/v1/gram-sahakari/application/start',
  me: '/api/v1/gram-sahakari/application/me',
  update: '/api/v1/gram-sahakari/application',
  upload: '/api/v1/gram-sahakari/application/upload',
  submit: '/api/v1/gram-sahakari/application/submit',
  status: '/api/v1/gram-sahakari/application/status',
} as const

/** POST /application/start — creates a fresh DRAFT for the user. */
export const startApplication = async (): Promise<ApplicationDTO> => {
  const { data } = await api.post<ApiSuccessResponse<ApplicationDTO>>(
    ENDPOINTS.start,
  )
  return data.data
}

/** GET /application/me — throws 404 if the user has no application yet. */
export const getMyApplication = async (): Promise<ApplicationDTO> => {
  const { data } = await api.get<ApiSuccessResponse<ApplicationDTO>>(ENDPOINTS.me)
  return data.data
}

/** PUT /application — partial update of the DRAFT (auto-save). */
export const updateApplication = async (
  body: UpdateApplicationBody,
): Promise<ApplicationDTO> => {
  const { data } = await api.put<ApiSuccessResponse<ApplicationDTO>>(
    ENDPOINTS.update,
    body,
  )
  return data.data
}

/** POST /application/upload — multipart upload; field name is `file`. */
export const uploadDocument = async (
  documentType: DocumentType,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadDocumentResponse> => {
  const form = new FormData()
  form.append('documentType', documentType)
  form.append('file', file)

  const { data } = await api.post<ApiSuccessResponse<UploadDocumentResponse>>(
    ENDPOINTS.upload,
    form,
    {
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    },
  )
  return data.data
}

/** POST /application/submit — finalizes the DRAFT (must be complete). */
export const submitApplication = async (): Promise<ApplicationDTO> => {
  const { data } = await api.post<ApiSuccessResponse<ApplicationDTO>>(
    ENDPOINTS.submit,
  )
  return data.data
}

/** GET /application/status — lightweight status payload. */
export const getApplicationStatus = async (): Promise<ApplicationStatusDTO> => {
  const { data } = await api.get<ApiSuccessResponse<ApplicationStatusDTO>>(
    ENDPOINTS.status,
  )
  return data.data
}
