import { Request, Response } from "express";
import { getAuthUser } from "../../auth/auth.middleware";
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../../../types/api-response";
import type {
  CreateSubscriptionResponseDTO,
  SubscriptionDTO,
  SubscriptionStatusDTO,
  VerifySubscriptionResponseDTO,
} from "../dto/subscription.dto";
import {
  cancelSubscription,
  createSubscription,
  getCurrentSubscription,
  getSubscriptionStatus,
  refreshSubscriptionState,
  resumeSubscription,
  verifySubscriptionAuth,
} from "../service/subscription.service";
import {
  getBillingHistory,
  getBillingPaymentDetail,
} from "../service/billing.service";
import { handleSubscriptionWebhook } from "../service/webhook.service";
import {
  validateCancelSubscription,
  validateVerifySubscription,
} from "../validation/subscription.validation";
import { createSubscriptionRefund } from "../service/refund.service";
import type { BillingPaymentDTO } from "../dto/subscription.dto";

export const createSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<CreateSubscriptionResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const data = await createSubscription(userId, role);
  res.status(201).json({ success: true, data });
};

export const getCurrentSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SubscriptionDTO | null>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getCurrentSubscription(userId);
  res.status(200).json({ success: true, data });
};

export const getSubscriptionStatusHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SubscriptionStatusDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getSubscriptionStatus(userId);
  res.status(200).json({ success: true, data });
};

export const verifySubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<VerifySubscriptionResponseDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const body = validateVerifySubscription(req.body);
  const data = await verifySubscriptionAuth(userId, body, role);
  res.status(200).json({ success: true, data });
};

export const cancelSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SubscriptionDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const body = validateCancelSubscription(req.body);
  const data = await cancelSubscription(userId, body, role);
  res.status(200).json({ success: true, data });
};

export const resumeSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SubscriptionDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const data = await resumeSubscription(userId, role);
  res.status(200).json({ success: true, data });
};

export const refreshSubscriptionHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<SubscriptionDTO>>
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  const data = await refreshSubscriptionState(userId, role);
  res.status(200).json({ success: true, data });
};

export const billingHistoryHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<BillingPaymentDTO[]>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const data = await getBillingHistory(userId);
  res.status(200).json({ success: true, data });
};

export const billingDetailHandler = async (
  req: Request,
  res: Response<ApiSuccessResponse<BillingPaymentDTO>>
): Promise<void> => {
  const { userId } = getAuthUser(req);
  const paymentId = String(req.params.paymentId ?? "").trim();
  if (!paymentId) {
    res.status(400).json({ success: false, message: "paymentId is required." } as never);
    return;
  }
  const data = await getBillingPaymentDetail(userId, paymentId);
  res.status(200).json({ success: true, data });
};

export const subscriptionWebhookHandler = async (
  req: Request,
  res: Response<
    ApiSuccessResponse<{ received: true; status: string }> | ApiErrorResponse
  >
): Promise<void> => {
  const rawBody = req.rawBody ? req.rawBody.toString("utf8") : "";
  const signature = req.header("X-Razorpay-Signature") ?? undefined;
  const eventId = req.header("X-Razorpay-Event-Id") ?? undefined;

  const result = await handleSubscriptionWebhook(
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

/** Placeholder — returns 501 until refunds are enabled. */
export const refundSubscriptionHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, role } = getAuthUser(req);
  await createSubscriptionRefund({
    userId,
    subscriptionId: String(req.body?.subscriptionId ?? ""),
    paymentId: String(req.body?.paymentId ?? ""),
    amountPaise:
      typeof req.body?.amountPaise === "number"
        ? req.body.amountPaise
        : undefined,
    reason:
      typeof req.body?.reason === "string" ? req.body.reason : undefined,
    actorUserId: userId,
    actorRole: role,
  });
  res.status(501).json({ success: false, message: "Not implemented." });
};
