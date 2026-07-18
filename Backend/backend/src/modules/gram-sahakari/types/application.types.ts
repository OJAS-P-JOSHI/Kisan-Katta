import type {
  APPLICATION_STATUSES,
  AUDIT_ACTIONS,
  DOCUMENT_TYPES,
  GENDERS,
  PAYMENT_STATUSES,
} from "../gram-sahakari.constants";

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface UpdateApplicationBody {
  fullName?: string;
  phone?: string;
  email?: string;
  gender?: Gender;
  dob?: string;
  district?: string;
  taluka?: string;
  village?: string;
  address?: string;
  pincode?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  bankAccountHolder?: string;
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
  education?: string;
  occupation?: string;
  languages?: string[];
  experience?: string;
  whyJoin?: string;
}

export interface AdminApplicationsQuery {
  district?: string;
  status?: ApplicationStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ReviewApplicationBody {
  reviewRemarks?: string;
  assignedTo?: string;
}

export interface RejectApplicationBody {
  reviewRemarks: string;
}

export interface PaymentSuccessBody {
  paymentReference: string;
}
