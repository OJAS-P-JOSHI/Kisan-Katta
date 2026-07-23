/**
 * Gram Sahakari application DTOs — mirrored from the finalized backend
 * (`Backend/backend/src/modules/gram-sahakari`). Do not invent fields.
 */

export const APPLICATION_STATUSES = [
  'DRAFT',
  'PAYMENT_PENDING',
  'SUBMITTED',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'NOT_REQUIRED',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const
export type Gender = (typeof GENDERS)[number]

/** Exact document-type keys the backend upload endpoint accepts. */
export const DOCUMENT_TYPES = [
  'photo',
  'aadhaarFront',
  'aadhaarBack',
  'cancelledCheque',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export type CloudinaryDocument = {
  url: string
  publicId: string
}

/** GET /application/me — the full application record. */
export type ApplicationDTO = {
  id: string
  applicationNumber: string
  userId: string
  status: ApplicationStatus
  fullName: string | null
  phone: string | null
  /** Verified login mobile — same value as `phone`. */
  phoneNumber?: string | null
  email: string | null
  gender: Gender | null
  dob: string | null
  photo: CloudinaryDocument | null
  district: string | null
  taluka: string | null
  village: string | null
  address: string | null
  pincode: string | null
  aadhaarNumber: string | null
  aadhaarFront: CloudinaryDocument | null
  aadhaarBack: CloudinaryDocument | null
  cancelledChequeImage: CloudinaryDocument | null
  bankAccountHolder: string | null
  bankAccountNumber: string | null
  bankIFSC: string | null
  bankName: string | null
  paymentStatus: PaymentStatus
  paymentReference: string | null
  reviewRemarks: string | null
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

/** GET /application/status — lightweight status payload. */
export type ApplicationStatusDTO = {
  applicationNumber: string
  status: ApplicationStatus
  paymentStatus: PaymentStatus
  reviewRemarks: string | null
}

/** PUT /application — the backend validates this with `.strict()`. */
export type UpdateApplicationBody = {
  fullName?: string
  email?: string
  gender?: Gender
  dob?: string
  district?: string
  taluka?: string
  village?: string
  address?: string
  pincode?: string
  aadhaarNumber?: string
  bankAccountHolder?: string
  bankAccountNumber?: string
  bankIFSC?: string
  bankName?: string
}

/** POST /application/upload response. */
export type UploadDocumentResponse = {
  documentType: DocumentType
  document: CloudinaryDocument
}

/** POST /application/payment/create-order response. */
export type CreateOrderResponse = {
  orderId: string
  amount: number
  currency: string
  key: string
  applicationNumber: string
}

/** POST /application/payment/verify response. */
export type VerifyPaymentResponse = {
  applicationNumber: string
  status: ApplicationStatus
  paymentStatus: PaymentStatus
  paymentVerified: boolean
  razorpayPaymentId: string | null
  paidAt: string | null
}

/** POST /application/payment/verify request body. */
export type VerifyPaymentBody = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
