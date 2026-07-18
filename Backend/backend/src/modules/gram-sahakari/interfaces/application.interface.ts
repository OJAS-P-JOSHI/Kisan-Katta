import type { Types } from "mongoose";
import type {
  ApplicationStatus,
  AuditAction,
  DocumentType,
  Gender,
  PaymentStatus,
} from "../types/application.types";

export interface ICloudinaryDocument {
  url: string;
  publicId: string;
}

export interface IExperienceCertificate extends ICloudinaryDocument {
  label?: string;
}

/** Reserved for OCR, digital ID, commission payouts, and QR verification. */
export interface IApplicationMetadata {
  ocrExtraction?: Record<string, unknown>;
  digitalId?: string;
  commissionProfileId?: string;
  qrVerificationCode?: string;
}

export interface IGramSahakariApplication {
  _id?: Types.ObjectId;
  applicationNumber: string;
  userId: Types.ObjectId;
  status: ApplicationStatus;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  gender: Gender | null;
  dob: Date | null;
  photo: ICloudinaryDocument | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  address: string | null;
  pincode: string | null;
  aadhaarNumber: string | null;
  aadhaarFront: ICloudinaryDocument | null;
  aadhaarBack: ICloudinaryDocument | null;
  panNumber: string | null;
  panImage: ICloudinaryDocument | null;
  cancelledChequeImage: ICloudinaryDocument | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankName: string | null;
  education: string | null;
  occupation: string | null;
  languages: string[];
  experience: string | null;
  experienceCertificates: IExperienceCertificate[];
  whyJoin: string | null;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  reviewedBy: Types.ObjectId | null;
  assignedTo: Types.ObjectId | null;
  reviewRemarks: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  submittedAt: Date | null;
  metadata: IApplicationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLogEntry {
  action: AuditAction;
  applicationId: string;
  actorUserId: string;
  actorRole: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export type UploadableDocumentField = Exclude<
  DocumentType,
  "experienceCertificate"
>;
