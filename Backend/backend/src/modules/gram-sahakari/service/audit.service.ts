import type { AuditAction } from "../types/application.types";
import type { IAuditLogEntry } from "../interfaces/application.interface";

export const logAuditEvent = (entry: Omit<IAuditLogEntry, "timestamp">): void => {
  const payload: IAuditLogEntry = {
    ...entry,
    timestamp: new Date(),
  };

  // Structured audit log for future analytics pipelines.
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      module: "gram-sahakari",
      audit: true,
      action: payload.action satisfies AuditAction,
      applicationId: payload.applicationId,
      actorUserId: payload.actorUserId,
      actorRole: payload.actorRole,
      details: payload.details ?? {},
      timestamp: payload.timestamp.toISOString(),
    })
  );
};
