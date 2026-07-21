import { Types } from "mongoose";
import { resolveDistrict } from "../../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../../utils/AppError";
import type { UserRole } from "../../auth/auth.constants";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../gram-sahakari.constants";
import type { IGramSahakariApplication } from "../interfaces/application.interface";
import {
  createDraftApplication,
  findApplicationById,
  findApplicationByUserId,
  findApplications,
  findBlockingApplicationByUserId,
  saveApplicationDocument,
  updateApplicationById,
} from "../repository/application.repository";
import type {
  AdminApplicationsQuery,
  UpdateApplicationBody,
} from "../types/application.types";
import { assertSubmitReady } from "../validation/application.validation";
import { generateApplicationNumber } from "./application-number.service";
import { logAuditEvent } from "./audit.service";
import {
  getDocumentFieldName,
  uploadGramSahakariDocument,
} from "./upload.service";
import type { DocumentType } from "../types/application.types";
import type {
  ApplicationDTO,
  ApplicationStatusDTO,
  ApplicationSummaryDTO,
  PaginatedApplicationsDTO,
  UploadDocumentResponseDTO,
} from "../dto/application.dto";
import { toCloudinaryDocumentDTO } from "../dto/application.dto";

// ---------------------------------------------------------------------------
// DTO mappers
// ---------------------------------------------------------------------------

const toIsoString = (value: Date | null | undefined): string | null =>
  value ? value.toISOString() : null;

export const toApplicationDTO = (
  application: IGramSahakariApplication
): ApplicationDTO => {
  if (!application._id) {
    throw new AppError("Application record is missing an identifier.", 500);
  }

  return {
    id: String(application._id),
    applicationNumber: application.applicationNumber,
    userId: String(application.userId),
    status: application.status,
    fullName: application.fullName,
    phone: application.phone,
    email: application.email,
    gender: application.gender,
    dob: toIsoString(application.dob),
    photo: toCloudinaryDocumentDTO(application.photo),
    district: application.district,
    taluka: application.taluka,
    village: application.village,
    address: application.address,
    pincode: application.pincode,
    aadhaarNumber: application.aadhaarNumber,
    aadhaarFront: toCloudinaryDocumentDTO(application.aadhaarFront),
    aadhaarBack: toCloudinaryDocumentDTO(application.aadhaarBack),
    cancelledChequeImage: toCloudinaryDocumentDTO(application.cancelledChequeImage),
    bankAccountHolder: application.bankAccountHolder,
    bankAccountNumber: application.bankAccountNumber,
    bankIFSC: application.bankIFSC,
    bankName: application.bankName,
    paymentStatus: application.paymentStatus,
    paymentReference: application.paymentReference,
    reviewRemarks: null,
    submittedAt: toIsoString(application.submittedAt),
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
};

const toApplicationSummaryDTO = (
  application: IGramSahakariApplication
): ApplicationSummaryDTO => {
  if (!application._id) {
    throw new AppError("Application record is missing an identifier.", 500);
  }

  return {
    id: String(application._id),
    applicationNumber: application.applicationNumber,
    userId: String(application.userId),
    status: application.status,
    fullName: application.fullName,
    phone: application.phone,
    district: application.district,
    taluka: application.taluka,
    village: application.village,
    paymentStatus: application.paymentStatus,
    submittedAt: toIsoString(application.submittedAt),
    createdAt: application.createdAt.toISOString(),
  };
};

const assertDraftApplication = (application: IGramSahakariApplication): void => {
  if (application.status !== "DRAFT") {
    throw new AppError("Only draft applications can be modified.", 409);
  }
};

const getApplicationOrThrow = async (
  applicationId: string
): Promise<IGramSahakariApplication & { _id: Types.ObjectId }> => {
  const application = await findApplicationById(applicationId);
  if (!application) {
    throw new AppError("Application not found.", 404);
  }
  return application as IGramSahakariApplication & { _id: Types.ObjectId };
};

// ---------------------------------------------------------------------------
// Applicant services
// ---------------------------------------------------------------------------

export const startApplication = async (
  userId: string,
  actorRole: UserRole
): Promise<ApplicationDTO> => {
  const existing = await findBlockingApplicationByUserId(userId);
  if (existing) {
    throw new AppError("You already have an active Gram Sahakari application.", 409);
  }

  const { applicationNumber, sequence } = await generateApplicationNumber();
  const application = await createDraftApplication(userId, applicationNumber);

  logAuditEvent({
    action: "APPLICATION_STARTED",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
  });

  logAuditEvent({
    action: "APPLICATION_NUMBER_GENERATED",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
    details: { applicationNumber, sequence },
  });

  return toApplicationDTO(application);
};

export const getMyApplication = async (userId: string): Promise<ApplicationDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found.", 404);
  }
  return toApplicationDTO(application as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const updateMyApplication = async (
  userId: string,
  body: UpdateApplicationBody,
  actorRole: UserRole
): Promise<ApplicationDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found. Start an application first.", 404);
  }

  assertDraftApplication(application);

  const { dob, district, bankIFSC, ...rest } = body;
  const update: Partial<IGramSahakariApplication> = { ...rest };

  if (district) {
    const { district: canonicalDistrict } = resolveDistrict(district);
    update.district = canonicalDistrict;
  }

  if (dob) {
    update.dob = new Date(dob);
  }

  if (bankIFSC) {
    update.bankIFSC = bankIFSC.toUpperCase();
  }

  const updated = await updateApplicationById(String(application._id), update);
  if (!updated) {
    throw new AppError("Failed to update application.", 500);
  }

  logAuditEvent({
    action: "APPLICATION_UPDATED",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
    details: { fields: Object.keys(body) },
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const uploadApplicationDocument = async (
  userId: string,
  documentType: DocumentType,
  file: Express.Multer.File,
  actorRole: UserRole
): Promise<UploadDocumentResponseDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found. Start an application first.", 404);
  }

  assertDraftApplication(application);

  const field = getDocumentFieldName(documentType);
  const existingDocument = application[field] as
    | import("../interfaces/application.interface").ICloudinaryDocument
    | null;

  const uploadResult = await uploadGramSahakariDocument(file, documentType, {
    existingDocument,
  });

  const update: Partial<IGramSahakariApplication> = {
    [field]: uploadResult.document,
  };

  const updated = await saveApplicationDocument(String(application._id), update);
  if (!updated) {
    throw new AppError("Failed to save uploaded document.", 500);
  }

  logAuditEvent({
    action: "DOCUMENT_UPLOADED",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
    details: { documentType },
  });

  return {
    documentType,
    document: toCloudinaryDocumentDTO(uploadResult.document)!,
  };
};

/**
 * Prepares a draft for payment. Does NOT officially submit the application.
 * Official submission (status = SUBMITTED) happens only inside completePayment().
 */
export const submitApplication = async (
  userId: string,
  actorRole: UserRole
): Promise<ApplicationDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found. Start an application first.", 404);
  }

  if (application.status === "SUBMITTED") {
    throw new AppError("This application has already been submitted.", 409);
  }

  if (application.status === "PAYMENT_PENDING") {
    // Idempotent: already waiting for payment.
    return toApplicationDTO(application as IGramSahakariApplication & { _id: Types.ObjectId });
  }

  assertDraftApplication(application);
  assertSubmitReady(application);

  const updated = await updateApplicationById(String(application._id), {
    status: "PAYMENT_PENDING",
    paymentStatus: "PENDING",
  });

  if (!updated) {
    throw new AppError("Failed to prepare application for payment.", 500);
  }

  logAuditEvent({
    action: "APPLICATION_READY_FOR_PAYMENT",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const getApplicationStatus = async (userId: string): Promise<ApplicationStatusDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  return {
    applicationNumber: application.applicationNumber,
    status: application.status,
    paymentStatus: application.paymentStatus,
    reviewRemarks: null,
  };
};

// ---------------------------------------------------------------------------
// Admin read-only services (no review / approve / reject)
// ---------------------------------------------------------------------------

export const listApplications = async (
  query: AdminApplicationsQuery,
  _actor: { userId: string; role: UserRole }
): Promise<PaginatedApplicationsDTO> => {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  let district = query.district;
  if (district) {
    district = resolveDistrict(district).district;
  }

  const { items, total } = await findApplications({ ...query, page, limit, district });

  return {
    items: items.map((item) =>
      toApplicationSummaryDTO(item as IGramSahakariApplication & { _id: Types.ObjectId })
    ),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const getApplicationById = async (
  applicationId: string,
  _actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);
  return toApplicationDTO(application);
};

export const assertApplicationOwnership = (
  application: IGramSahakariApplication,
  userId: string
): void => {
  if (String(application.userId) !== userId) {
    throw new AppError("You do not have access to this application.", 403);
  }
};
