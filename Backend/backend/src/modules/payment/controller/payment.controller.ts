import { Request, Response } from "express";
import { getAuthUser } from "../../auth/auth.middleware";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../types/api-response";
import type {
  CreateOrderResponseDTO,
  PaymentDetailsDTO,
  PaymentFailureResponseDTO,
  ReconciliationResultDTO,
  VerifyPaymentResponseDTO,
  WebhookAckDTO,
} from "../dto/payment.dto";
import {
  createPaymentOrder,
  getPaymentDetails,
  recordPaymentFailure,
  verifyPayment,
} from "../service/payment.service";
import { handleWebhook } from "../service/webhook.service";
import { reconcileApplicationForAdmin } from "../service/reconciliation.service";
import {
  validateApplicationIdParam,
  validatePaymentFailure,
  validateVerifyPayment,
} from "../validation/payment.validation";
import { paymentDebug, paymentDebugError } from "../payment-debug";

export const createOrderHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<CreateOrderResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  try {
    const data = await createPaymentOrder(userId, role);
    res.status(201).json({ success: true, data });
  } catch (error) {
    paymentDebugError("Create Order handler failed", error, { userId, role });
    throw error;
  }
};

export const verifyPaymentHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<VerifyPaymentResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  paymentDebug("Verify handler: incoming request headers", {
    authorization: req.headers.authorization ? "Bearer ***" : null,
    contentType: req.headers["content-type"] ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    authenticatedUserId: userId,
    actorRole: role,
  });
  try {
    const body = validateVerifyPayment(req.body);
    const data = await verifyPayment(userId, body, role);
    paymentDebug("Verify handler: response sent", {
      httpStatus: 200,
      applicationNumber: data.applicationNumber,
      paymentStatus: data.paymentStatus,
      paymentVerified: data.paymentVerified,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    paymentDebugError("Verify handler failed", error, { userId, role });
    throw error;
  }
};

export const paymentFailureHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaymentFailureResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const body = validatePaymentFailure(req.body);
  const data = await recordPaymentFailure(userId, body, role);
  res.status(200).json({ success: true, data });
};

export const paymentDetailsHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<PaymentDetailsDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getPaymentDetails(userId);
  res.status(200).json({ success: true, data });
};

/**
 * Public, unauthenticated endpoint hit by Razorpay. Security is provided
 * entirely by webhook signature verification inside the service.
 */
export const webhookHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<WebhookAckDTO> | ApiErrorResponse>
): Promise<void> => {
  const rawBody = req.rawBody ? req.rawBody.toString("utf8") : "";
  const signature = req.header("X-Razorpay-Signature") ?? undefined;
  const eventId = req.header("X-Razorpay-Event-Id") ?? undefined;

  const result = await handleWebhook(
    rawBody,
    signature,
    eventId,
    (req.body ?? {}) as Record<string, unknown>
  );

  if (result.httpStatus >= 400) {
    res.status(result.httpStatus).json({ success: false, message: result.detail });
    return;
  }

  res
    .status(result.httpStatus)
    .json({ success: true, data: { received: true, status: result.status } });
};

export const reconcileHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<ReconciliationResultDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const applicationId = validateApplicationIdParam(req.params.applicationId);
  const data = await reconcileApplicationForAdmin(applicationId, {
    userId,
    role,
  });
  res.status(200).json({ success: true, data });
};
