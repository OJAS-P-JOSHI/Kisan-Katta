import type { AxiosProgressEvent } from 'axios'
import axios from 'axios'

import { api } from '@/api/axios'
import { paymentDebug, paymentDebugError } from '@/lib/payment-debug'
import type { ApiSuccessResponse } from '@/types/auth.types'
import type {
  ApplicationDTO,
  ApplicationStatusDTO,
  CreateOrderResponse,
  DocumentType,
  UpdateApplicationBody,
  UploadDocumentResponse,
  VerifyPaymentBody,
  VerifyPaymentResponse,
} from '@/types/application.types'

/**
 * Gram Sahakari application API — finalized backend under `/api/v1/gram-sahakari`.
 */
const ENDPOINTS = {
  start: '/api/v1/gram-sahakari/application/start',
  me: '/api/v1/gram-sahakari/application/me',
  update: '/api/v1/gram-sahakari/application',
  upload: '/api/v1/gram-sahakari/application/upload',
  submit: '/api/v1/gram-sahakari/application/submit',
  status: '/api/v1/gram-sahakari/application/status',
  createOrder: '/api/v1/gram-sahakari/application/payment/create-order',
  verifyPayment: '/api/v1/gram-sahakari/application/payment/verify',
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

/**
 * POST /application/submit — validates the draft and moves it to PAYMENT_PENDING.
 * Does NOT finalize submission; payment verify does that.
 */
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

/** POST /application/payment/create-order — Razorpay order from backend. */
export const createPaymentOrder = async (): Promise<CreateOrderResponse> => {
  paymentDebug('Creating Razorpay order')
  try {
    const { data } = await api.post<ApiSuccessResponse<CreateOrderResponse>>(
      ENDPOINTS.createOrder,
    )
    paymentDebug('After create-order response', {
      success: data.success,
      orderId: data.data.orderId,
      amount: data.data.amount,
      currency: data.data.currency,
      key: data.data.key,
      applicationNumber: data.data.applicationNumber,
    })
    return data.data
  } catch (error) {
    paymentDebugError('create-order request failed', error)
    throw error
  }
}

/** POST /application/payment/verify — finalize payment after Razorpay success. */
export const verifyPayment = async (
  body: VerifyPaymentBody,
): Promise<VerifyPaymentResponse> => {
  paymentDebug('Immediately before calling verify API', { verifyPayload: body })
  try {
    const { data, status } = await api.post<ApiSuccessResponse<VerifyPaymentResponse>>(
      ENDPOINTS.verifyPayment,
      body,
    )
    paymentDebug('After verify response', {
      httpStatus: status,
      responseBody: data,
      applicationNumber: data.data.applicationNumber,
      paymentStatus: data.data.paymentStatus,
      paymentVerified: data.data.paymentVerified,
    })
    return data.data
  } catch (error) {
    paymentDebugError('verify request failed', error)
    if (axios.isAxiosError(error)) {
      paymentDebug('Verify error axios details', {
        status: error.response?.status,
        data: error.response?.data,
      })
    }
    throw error
  }
}
