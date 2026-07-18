import { Types } from "mongoose";
import { resolveDistrict } from "../../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../../utils/AppError";
import type { UserRole } from "../../auth/auth.constants";
import { AuthUser } from "../../auth/auth.model";
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
  PaymentSuccessBody,
  RejectApplicationBody,
  ReviewApplicationBody,
  UpdateApplicationBody,
} from "../types/application.types";
import {
  assertSubmitReady,
} from "../validation/application.validation";
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
import {
  toCloudinaryDocumentDTO,
  toExperienceCertificateDTO,
} from "../dto/application.dto";

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
  panNumber: application.panNumber,
  panImage: toCloudinaryDocumentDTO(application.panImage),
  cancelledChequeImage: toCloudinaryDocumentDTO(application.cancelledChequeImage),
  bankAccountHolder: application.bankAccountHolder,
  bankAccountNumber: application.bankAccountNumber,
  bankIFSC: application.bankIFSC,
  bankName: application.bankName,
  education: application.education,
  occupation: application.occupation,
  languages: application.languages ?? [],
  experience: application.experience,
  experienceCertificates: (application.experienceCertificates ?? []).map(
    toExperienceCertificateDTO
  ),
  whyJoin: application.whyJoin,
  paymentStatus: application.paymentStatus,
  paymentReference: application.paymentReference,
  reviewedBy: application.reviewedBy ? String(application.reviewedBy) : null,
  assignedTo: application.assignedTo ? String(application.assignedTo) : null,
  reviewRemarks: application.reviewRemarks,
  approvedAt: toIsoString(application.approvedAt),
  rejectedAt: toIsoString(application.rejectedAt),
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

  // Generate the permanent application number BEFORE creating the document so
  // it can be stored atomically as a required, immutable field.
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

  const { dob, district, bankIFSC, panNumber, ...rest } = body;
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

  if (panNumber) {
    update.panNumber = panNumber.toUpperCase();
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

  const uploadResult = await uploadGramSahakariDocument(file, documentType, {
    existingDocument:
      documentType !== "experienceCertificate"
        ? (application[getDocumentFieldName(documentType as Exclude<DocumentType, "experienceCertificate">)] as import("../interfaces/application.interface").ICloudinaryDocument | null)
        : null,
    existingCertificates: application.experienceCertificates,
  });

  const update: Partial<IGramSahakariApplication> = {};

  if (documentType === "experienceCertificate") {
    update.experienceCertificates = [
      ...(application.experienceCertificates ?? []),
      uploadResult.document as import("../interfaces/application.interface").IExperienceCertificate,
    ];
  } else {
    const field = getDocumentFieldName(documentType as Exclude<DocumentType, "experienceCertificate">);
    (update as Record<string, unknown>)[field] = uploadResult.document;
  }

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
    document: toCloudinaryDocumentDTO(uploadResult.document as import("../interfaces/application.interface").ICloudinaryDocument)!,
  };
};

export const submitApplication = async (
  userId: string,
  actorRole: UserRole
): Promise<ApplicationDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found. Start an application first.", 404);
  }

  assertDraftApplication(application);
  assertSubmitReady(application);

  const updated = await updateApplicationById(String(application._id), {
    status: "SUBMITTED",
    submittedAt: new Date(),
    paymentStatus: "PENDING",
  });

  if (!updated) {
    throw new AppError("Failed to submit application.", 500);
  }

  logAuditEvent({
    action: "APPLICATION_SUBMITTED",
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
    reviewRemarks: application.reviewRemarks,
  };
};

export const recordPaymentSuccess = async (
  userId: string,
  body: PaymentSuccessBody,
  actorRole: UserRole
): Promise<ApplicationStatusDTO> => {
  const application = await findApplicationByUserId(userId);
  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  if (!["SUBMITTED", "UNDER_REVIEW", "APPROVED", "ACTIVE"].includes(application.status)) {
    throw new AppError("Payment cannot be recorded for this application status.", 409);
  }

  const nextStatus =
    application.status === "APPROVED" ? "ACTIVE" : application.status;

  const updated = await updateApplicationById(String(application._id), {
    paymentStatus: "PAID",
    paymentReference: body.paymentReference,
    status: nextStatus,
  });

  if (!updated) {
    throw new AppError("Failed to record payment.", 500);
  }

  logAuditEvent({
    action: "PAYMENT_UPDATED",
    applicationId: String(application._id),
    actorUserId: userId,
    actorRole,
    details: {
      paymentStatus: "PAID",
      paymentReference: body.paymentReference,
      status: nextStatus,
    },
  });

  return {
    applicationNumber: updated.applicationNumber,
    status: updated.status,
    paymentStatus: updated.paymentStatus,
    reviewRemarks: updated.reviewRemarks,
  };
};

// ---------------------------------------------------------------------------
// Admin / team services
// ---------------------------------------------------------------------------

export const listApplications = async (
  query: AdminApplicationsQuery,
  actor: { userId: string; role: UserRole }
): Promise<PaginatedApplicationsDTO> => {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;

  let district = query.district;
  if (district) {
    district = resolveDistrict(district).district;
  }

  const assignedTo = actor.role === "TEAM" ? actor.userId : undefined;

  const { items, total } = await findApplications(
    { ...query, page, limit, district },
    { assignedTo }
  );

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
  actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);

  if (actor.role === "TEAM") {
    const assignedTo = application.assignedTo ? String(application.assignedTo) : null;
    if (assignedTo !== actor.userId) {
      throw new AppError("You are not assigned to this application.", 403);
    }
  }

  return toApplicationDTO(application);
};

export const reviewApplication = async (
  applicationId: string,
  body: ReviewApplicationBody,
  actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);

  if (actor.role === "TEAM") {
    const assignedTo = application.assignedTo ? String(application.assignedTo) : null;
    if (assignedTo !== actor.userId) {
      throw new AppError("You are not assigned to this application.", 403);
    }
  }

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) {
    throw new AppError("Only submitted applications can be reviewed.", 409);
  }

  const update: Partial<IGramSahakariApplication> = {
    status: "UNDER_REVIEW",
    reviewedBy: new Types.ObjectId(actor.userId),
  };

  if (body.reviewRemarks !== undefined) {
    update.reviewRemarks = body.reviewRemarks;
  }

  if (body.assignedTo && actor.role === "ADMIN") {
    update.assignedTo = new Types.ObjectId(body.assignedTo);
  }

  const updated = await updateApplicationById(applicationId, update);
  if (!updated) {
    throw new AppError("Failed to update application review state.", 500);
  }

  logAuditEvent({
    action: body.reviewRemarks ? "REMARKS_UPDATED" : "APPLICATION_REVIEWED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    details: { ...body },
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const approveApplication = async (
  applicationId: string,
  actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) {
    throw new AppError("Only submitted or under-review applications can be approved.", 409);
  }

  const updated = await updateApplicationById(applicationId, {
    status: "APPROVED",
    approvedAt: new Date(),
    reviewedBy: new Types.ObjectId(actor.userId),
    rejectedAt: null,
  });

  if (!updated) {
    throw new AppError("Failed to approve application.", 500);
  }

  await AuthUser.findByIdAndUpdate(application.userId, { role: "GRAM_SAHAKARI" });

  logAuditEvent({
    action: "APPLICATION_APPROVED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
  });

  logAuditEvent({
    action: "ROLE_CHANGED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    details: {
      userId: String(application.userId),
      from: "FARMER",
      to: "GRAM_SAHAKARI",
    },
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const rejectApplication = async (
  applicationId: string,
  body: RejectApplicationBody,
  actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);

  if (!["SUBMITTED", "UNDER_REVIEW"].includes(application.status)) {
    throw new AppError("Only submitted or under-review applications can be rejected.", 409);
  }

  const updated = await updateApplicationById(applicationId, {
    status: "REJECTED",
    rejectedAt: new Date(),
    reviewRemarks: body.reviewRemarks,
    reviewedBy: new Types.ObjectId(actor.userId),
  });

  if (!updated) {
    throw new AppError("Failed to reject application.", 500);
  }

  logAuditEvent({
    action: "APPLICATION_REJECTED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    details: { reviewRemarks: body.reviewRemarks },
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const suspendApplication = async (
  applicationId: string,
  actor: { userId: string; role: UserRole }
): Promise<ApplicationDTO> => {
  const application = await getApplicationOrThrow(applicationId);

  if (application.status !== "ACTIVE") {
    throw new AppError("Only active applications can be suspended.", 409);
  }

  const updated = await updateApplicationById(applicationId, {
    status: "SUSPENDED",
    reviewedBy: new Types.ObjectId(actor.userId),
  });

  if (!updated) {
    throw new AppError("Failed to suspend application.", 500);
  }

  logAuditEvent({
    action: "APPLICATION_SUSPENDED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
  });

  return toApplicationDTO(updated as IGramSahakariApplication & { _id: Types.ObjectId });
};

export const assertApplicationOwnership = (
  application: IGramSahakariApplication,
  userId: string
): void => {
  if (String(application.userId) !== userId) {
    throw new AppError("You do not have access to this application.", 403);
  }
};
