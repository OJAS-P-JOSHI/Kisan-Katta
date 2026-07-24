import type { IGramSahakariApplication } from "../interfaces/application.interface";
import type { PaymentStatus } from "../types/application.types";

type ProgressPick = Pick<
  IGramSahakariApplication,
  | "fullName"
  | "aadhaarNumber"
  | "photo"
  | "bankAccountNumber"
  | "submittedAt"
  | "paymentStatus"
>;

type StringField = "fullName" | "aadhaarNumber" | "bankAccountNumber";
type DocumentField = "photo";
type DateField = "submittedAt";

type ProgressIndicator =
  | { kind: "string"; field: StringField }
  | { kind: "document"; field: DocumentField }
  | { kind: "date"; field: DateField }
  | { kind: "paymentStarted" };

/**
 * Single source of truth for whether a user has started filling an application.
 * Add or remove steps here — `hasStartedApplication` and Mongo filters stay aligned.
 *
 * Location-only fields (district / taluka / village) are intentionally omitted;
 * they can be set accidentally and do not prove meaningful progress.
 */
export const APPLICATION_PROGRESS_INDICATORS: readonly ProgressIndicator[] = [
  { kind: "string", field: "fullName" },
  { kind: "string", field: "aadhaarNumber" },
  { kind: "document", field: "photo" },
  { kind: "string", field: "bankAccountNumber" },
  { kind: "date", field: "submittedAt" },
  { kind: "paymentStarted" },
];

const hasNonEmptyString = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

const hasUploadedDocument = (value: unknown): boolean =>
  value != null &&
  typeof value === "object" &&
  typeof (value as { url?: unknown }).url === "string" &&
  (value as { url: string }).url.trim().length > 0;

const isPaymentStarted = (
  paymentStatus: PaymentStatus | null | undefined
): boolean => paymentStatus != null && paymentStatus !== "NOT_REQUIRED";

/**
 * Returns true when the application has meaningful user progress
 * (not just a placeholder DRAFT created at /application/start).
 */
export const hasStartedApplication = (
  application: Partial<ProgressPick>
): boolean => {
  for (const indicator of APPLICATION_PROGRESS_INDICATORS) {
    switch (indicator.kind) {
      case "string":
        if (hasNonEmptyString(application[indicator.field])) return true;
        break;
      case "document":
        if (hasUploadedDocument(application[indicator.field])) return true;
        break;
      case "date":
        if (application[indicator.field] != null) return true;
        break;
      case "paymentStarted":
        if (isPaymentStarted(application.paymentStatus)) return true;
        break;
    }
  }
  return false;
};

/** Draft-focused alias for `hasStartedApplication`. */
export const isMeaningfulDraft = hasStartedApplication;

const indicatorToMongoClause = (
  indicator: ProgressIndicator
): Record<string, unknown> => {
  switch (indicator.kind) {
    case "string":
      return { [indicator.field]: { $nin: [null, ""] } };
    case "document":
      return { [`${indicator.field}.url`]: { $type: "string", $ne: "" } };
    case "date":
      return { [indicator.field]: { $ne: null } };
    case "paymentStarted":
      return { paymentStatus: { $ne: "NOT_REQUIRED" } };
  }
};

/** Mongo filter matching applications where `hasStartedApplication()` is true. */
export const buildHasStartedApplicationFilter = (): Record<string, unknown> => ({
  $or: APPLICATION_PROGRESS_INDICATORS.map(indicatorToMongoClause),
});

/**
 * Admin list default: exclude placeholder DRAFTs with no meaningful progress.
 * Equivalent to: status != DRAFT OR hasStartedApplication().
 */
export const buildExcludeUnstartedDraftsFilter = (): Record<string, unknown> => ({
  $or: [
    { status: { $ne: "DRAFT" } },
    ...APPLICATION_PROGRESS_INDICATORS.map(indicatorToMongoClause),
  ],
});
