import type { PaymentAuditAction } from "../types/payment.types";
import type { IPaymentAuditLogEntry } from "../interfaces/payment.interface";

/**
 * Structured, fire-and-forget audit logging for the payment module. Mirrors the
 * gram-sahakari audit service so both feed the same downstream log pipeline.
 * Sensitive values (signatures, secrets) are never logged.
 */
export const logAuditEvent = (
  entry: Omit<IPaymentAuditLogEntry, "timestamp">
): void => {
  const payload: IPaymentAuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      module: "payment",
      audit: true,
      action: payload.action satisfies PaymentAuditAction,
      applicationId: payload.applicationId,
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      details: payload.details ?? {},
      timestamp: payload.timestamp.toISOString(),
    })
  );
};
