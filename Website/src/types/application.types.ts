/**
 * Gram Sahakari application DTOs — replicated verbatim from the backend
 * (`Backend/backend/src/modules/gram-sahakari`). The website consumes these
 * contracts exactly; do not invent fields.
 */

export const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'ACTIVE',
  'SUSPENDED',
] as const
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export const PAYMENT_STATUSES = [
  'NOT_REQUIRED',
  'PENDING',
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
  'pan',
  'cancelledCheque',
  'experienceCertificate',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export type CloudinaryDocument = {
  url: string
  publicId: string
}

export type ExperienceCertificate = CloudinaryDocument & {
  label?: string
}

/** GET /application/me — the full application record. */
export type ApplicationDTO = {
  id: string
  userId: string
  status: ApplicationStatus
  fullName: string | null
  phone: string | null
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
  panNumber: string | null
  panImage: CloudinaryDocument | null
  cancelledChequeImage: CloudinaryDocument | null
  bankAccountHolder: string | null
  bankAccountNumber: string | null
  bankIFSC: string | null
  bankName: string | null
  education: string | null
  occupation: string | null
  languages: string[]
  experience: string | null
  experienceCertificates: ExperienceCertificate[]
  whyJoin: string | null
  paymentStatus: PaymentStatus
  paymentReference: string | null
  reviewedBy: string | null
  assignedTo: string | null
  reviewRemarks: string | null
  approvedAt: string | null
  rejectedAt: string | null
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

/** GET /application/status — lightweight status payload. */
export type ApplicationStatusDTO = {
  status: ApplicationStatus
  paymentStatus: PaymentStatus
  reviewRemarks: string | null
}

/** PUT /application — the backend validates this with `.strict()`. */
export type UpdateApplicationBody = {
  fullName?: string
  phone?: string
  email?: string
  gender?: Gender
  dob?: string
  district?: string
  taluka?: string
  village?: string
  address?: string
  pincode?: string
  aadhaarNumber?: string
  panNumber?: string
  bankAccountHolder?: string
  bankAccountNumber?: string
  bankIFSC?: string
  bankName?: string
  education?: string
  occupation?: string
  languages?: string[]
  experience?: string
  whyJoin?: string
}

/** POST /application/upload response. */
export type UploadDocumentResponse = {
  documentType: DocumentType
  document: CloudinaryDocument
}
