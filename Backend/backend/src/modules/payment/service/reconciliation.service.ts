import { AppError } from "../../../utils/AppError";
import type { UserRole } from "../../auth/auth.constants";
import type { IGramSahakariApplication } from "../../gram-sahakari/interfaces/application.interface";
import {
  findApplicationById,
  findPendingPayableApplications,
} from "../repository/payment.repository";
import {
  fetchOrderPayments,
  type RazorpayPaymentSnapshot,
} from "./razorpay.service";
import { completePayment } from "./finalize.service";
import { logAuditEvent } from "./audit.service";
import type { ReconciliationResultDTO } from "../dto/payment.dto";
import { paymentDebug, paymentDebugError } from "../payment-debug";

const SYSTEM_ACTOR = { userId: "system", role: "SYSTEM" };

const pickCaptured = (
  payments: RazorpayPaymentSnapshot[]
): RazorpayPaymentSnapshot | undefined =>
  payments.find((p) => p.status === "captured");

const pickAuthorized = (
  payments: RazorpayPaymentSnapshot[]
): RazorpayPaymentSnapshot | undefined =>
  payments.find((p) => p.status === "authorized");

/**
 * Reconciles a single application against Razorpay's record of truth. If
 * Razorpay shows the order as paid/captured but our DB does not, the database
 * is repaired via the shared `completePayment` service. Safe to call
 * repeatedly (idempotent) and reused by the scheduled job below.
 */
export const reconcileApplication = async (
  applicationId: string,
  actor: { userId: string; role: string }
): Promise<ReconciliationResultDTO> => {
  const application = await findApplicationById(applicationId);
  if (!application) {
    throw new AppError("Application not found.", 404);
  }

  paymentDebug("Reconciliation: started", {
    applicationId,
    applicationNumber: application.applicationNumber,
    paymentStatus: application.paymentStatus,
    razorpayOrderId: application.razorpayOrderId,
    razorpayPaymentId: application.razorpayPaymentId,
  });

  logAuditEvent({
    action: "RECONCILIATION_STARTED",
    applicationId,
    actorUserId: actor.userId,
    actorRole: actor.role,
    details: { paymentStatus: application.paymentStatus },
  });

  const previousStatus = application.paymentStatus;

  const finish = (
    repaired: boolean,
    gatewayStatus: string | null,
    detail: string,
    current: IGramSahakariApplication
  ): ReconciliationResultDTO => {
    logAuditEvent({
      action: "RECONCILIATION_SUCCESS",
      applicationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: { repaired, previousStatus, currentStatus: current.paymentStatus },
    });
    return {
      applicationId,
      applicationNumber: current.applicationNumber,
      repaired,
      previousStatus,
      currentStatus: current.paymentStatus,
      gatewayStatus,
      detail,
    };
  };

  try {
    if (application.paymentStatus === "PAID") {
      return finish(false, "captured", "Already paid; nothing to repair.", application);
    }
    if (!application.razorpayOrderId) {
      return finish(false, null, "No Razorpay order to reconcile.", application);
    }

    const payments = await fetchOrderPayments(application.razorpayOrderId);
    const captured = pickCaptured(payments);
    const authorized = pickAuthorized(payments);

    paymentDebug("Reconciliation: gateway response", {
      applicationId,
      orderId: application.razorpayOrderId,
      paymentCount: payments.length,
      capturedPaymentId: captured?.id ?? null,
      capturedStatus: captured?.status ?? null,
      authorizedPaymentId: authorized?.id ?? null,
      gatewayPayments: payments.map((p) => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        currency: p.currency,
      })),
    });

    if (captured) {
      paymentDebug("Reconciliation: recovery attempted (captured payment found)", {
        applicationId,
        paymentId: captured.id,
      });
      const result = await completePayment({
        application,
        event: {
          kind: "PAID",
          razorpayOrderId: application.razorpayOrderId,
          razorpayPaymentId: captured.id,
          paymentMethod: captured.method,
          amount: captured.amount,
          currency: captured.currency,
          gatewayResponse: captured.raw,
        },
        source: "RECONCILIATION",
        actor,
        extraEvents: ["RECONCILIATION_REPAIR"],
      });
      paymentDebug("Reconciliation: recovery result (captured)", {
        applicationId,
        recoverySuccessful: result.changed,
        paymentStatus: result.paymentStatus,
        applicationStatus: result.application.status,
      });
      return finish(
        result.changed,
        "captured",
        result.changed ? "Repaired to PAID from Razorpay." : "Already consistent.",
        result.application
      );
    }

    if (
      authorized &&
      (application.paymentStatus === "PENDING" ||
        application.paymentStatus === "FAILED")
    ) {
      paymentDebug("Reconciliation: recovery attempted (authorized payment found)", {
        applicationId,
        paymentId: authorized.id,
        fromStatus: application.paymentStatus,
      });
      const result = await completePayment({
        application,
        event: {
          kind: "AUTHORIZED",
          razorpayOrderId: application.razorpayOrderId,
          razorpayPaymentId: authorized.id,
          paymentMethod: authorized.method,
          gatewayResponse: authorized.raw,
        },
        source: "RECONCILIATION",
        actor,
        extraEvents: ["RECONCILIATION_REPAIR"],
      });
      paymentDebug("Reconciliation: recovery result (authorized)", {
        applicationId,
        recoverySuccessful: result.changed,
        paymentStatus: result.paymentStatus,
      });
      return finish(
        result.changed,
        "authorized",
        result.changed ? "Repaired to AUTHORIZED from Razorpay." : "Already consistent.",
        result.application
      );
    }

    paymentDebug("Reconciliation: no recovery needed", {
      applicationId,
      recoveryAttempted: false,
    });
    return finish(false, "created", "Razorpay has no captured payment; no repair needed.", application);
  } catch (error) {
    paymentDebugError("Reconciliation: failed", error, { applicationId });
    logAuditEvent({
      action: "RECONCILIATION_FAILED",
      applicationId,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details: { message: error instanceof Error ? error.message : "unknown" },
    });
    throw error;
  }
};

/** Admin-triggered reconciliation for one application. */
export const reconcileApplicationForAdmin = (
  applicationId: string,
  actor: { userId: string; role: UserRole }
): Promise<ReconciliationResultDTO> =>
  reconcileApplication(applicationId, actor);

export interface ReconcileBatchSummary {
  scanned: number;
  repaired: number;
  failed: number;
  results: ReconciliationResultDTO[];
}

/**
 * Reusable batch reconciliation over all PENDING/AUTHORIZED payments. Not wired
 * to any scheduler — a future cron/interval can simply call this hourly.
 */
export const reconcilePendingPayments = async (
  limit = 100
): Promise<ReconcileBatchSummary> => {
  paymentDebug("Reconciliation batch: starting sweep", { limit });
  const applications = await findPendingPayableApplications(limit);
  const summary: ReconcileBatchSummary = {
    scanned: applications.length,
    repaired: 0,
    failed: 0,
    results: [],
  };

  for (const application of applications) {
    try {
      const result = await reconcileApplication(
        String(application._id),
        SYSTEM_ACTOR
      );
      if (result.repaired) summary.repaired += 1;
      summary.results.push(result);
    } catch (error) {
      paymentDebugError("Reconciliation batch: application failed", error, {
        applicationId: String(application._id),
      });
      summary.failed += 1;
    }
  }

  paymentDebug("Reconciliation batch: sweep complete", {
    scanned: summary.scanned,
    repaired: summary.repaired,
    failed: summary.failed,
  });

  return summary;
};
