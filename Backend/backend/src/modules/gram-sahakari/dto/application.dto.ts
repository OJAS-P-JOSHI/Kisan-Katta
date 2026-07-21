import type {
  ApplicationStatus,
  Gender,
  PaymentStatus,
} from "../types/application.types";
import type { ICloudinaryDocument } from "../interfaces/application.interface";

export interface CloudinaryDocumentDTO {
  url: string;
  publicId: string;
}

export interface ApplicationDTO {
  id: string;
  applicationNumber: string;
  userId: string;
  status: ApplicationStatus;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  gender: Gender | null;
  dob: string | null;
  photo: CloudinaryDocumentDTO | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  address: string | null;
  pincode: string | null;
  aadhaarNumber: string | null;
  aadhaarFront: CloudinaryDocumentDTO | null;
  aadhaarBack: CloudinaryDocumentDTO | null;
  cancelledChequeImage: CloudinaryDocumentDTO | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankName: string | null;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  /** Always null — review workflow removed; kept for Website response shape. */
  reviewRemarks: null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationStatusDTO {
  applicationNumber: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  /** Always null — review workflow removed; kept for Website response shape. */
  reviewRemarks: null;
}

export interface ApplicationSummaryDTO {
  id: string;
  applicationNumber: string;
  userId: string;
  status: ApplicationStatus;
  fullName: string | null;
  phone: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  paymentStatus: PaymentStatus;
  submittedAt: string | null;
  createdAt: string;
}

export interface PaginatedApplicationsDTO {
  items: ApplicationSummaryDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UploadDocumentResponseDTO {
  documentType: string;
  document: CloudinaryDocumentDTO;
}

export const toCloudinaryDocumentDTO = (
  doc: ICloudinaryDocument | null | undefined
): CloudinaryDocumentDTO | null => {
  if (!doc?.url || !doc.publicId) return null;
  return { url: doc.url, publicId: doc.publicId };
};
