import type { Types } from "mongoose";
import type {
  ApplicationStatus,
  AuditAction,
  DocumentType,
  Gender,
  PaymentStatus,
} from "../types/application.types";
import type {
  IPaymentEvent,
  IPaymentMeta,
} from "../../payment/interfaces/payment.interface";

export interface ICloudinaryDocument {
  url: string;
  publicId: string;
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
  cancelledChequeImage: ICloudinaryDocument | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIFSC: string | null;
  bankName: string | null;
  paymentStatus: PaymentStatus;
  paymentReference: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: Date | null;
  paymentMethod: string | null;
  paymentFailureReason: string | null;
  paymentAttemptCount: number;
  paymentVerified: boolean;
  authorizedAt: Date | null;
  refundedAt: Date | null;
  refundId: string | null;
  paymentEvents: IPaymentEvent[];
  paymentMeta: IPaymentMeta;
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

export type UploadableDocumentField = DocumentType;
