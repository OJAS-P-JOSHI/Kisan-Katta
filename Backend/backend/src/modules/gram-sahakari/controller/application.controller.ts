import { Request, Response } from "express";
import { getAuthUser } from "../../auth/auth.middleware";
import type { ApiSuccessResponse } from "../../../types/api-response";
import type {
  ApplicationDTO,
  ApplicationStatusDTO,
  UploadDocumentResponseDTO,
} from "../dto/application.dto";
import {
  getApplicationStatus,
  getMyApplication,
  recordPaymentSuccess,
  startApplication,
  submitApplication,
  updateMyApplication,
  uploadApplicationDocument,
} from "../service/application.service";
import {
  validateDocumentType,
  validatePaymentSuccess,
  validateUpdateApplication,
} from "../validation/application.validation";
import {
  assertUploadedFile,
} from "../middlewares/upload.middleware";

export const startApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const data = await startApplication(userId, role);
  res.status(201).json({ success: true, data });
};

export const getMyApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getMyApplication(userId);
  res.status(200).json({ success: true, data });
};

export const updateApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const body = validateUpdateApplication(req.body);
  const data = await updateMyApplication(userId, body, role);
  res.status(200).json({ success: true, data });
};

export const uploadDocumentHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<UploadDocumentResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);

  // [UPLOAD-DEBUG] Instrumentation — inspect what actually reached the controller.
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] contentType =", req.headers["content-type"]);
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] req.body =", JSON.stringify(req.body));
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] req.body.documentType =", req.body?.documentType);
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] req.file =", req.file ? {
    fieldname: req.file.fieldname,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    hasBuffer: Boolean(req.file.buffer),
  } : undefined);
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] req.files =", (req as unknown as { files?: unknown }).files);
  // eslint-disable-next-line no-console
  console.log("[UPLOAD-DEBUG] req.user =", { userId, role });

  const documentType = validateDocumentType(req.body.documentType);
  const file = assertUploadedFile(req.file);
  const data = await uploadApplicationDocument(userId, documentType, file, role);
  res.status(200).json({ success: true, data });
};

export const submitApplicationHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const data = await submitApplication(userId, role);
  res.status(200).json({ success: true, data });
};

export const getApplicationStatusHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationStatusDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getApplicationStatus(userId);
  res.status(200).json({ success: true, data });
};

export const paymentSuccessHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ApplicationStatusDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const body = validatePaymentSuccess(req.body);
  const data = await recordPaymentSuccess(userId, body, role);
  res.status(200).json({ success: true, data });
};
