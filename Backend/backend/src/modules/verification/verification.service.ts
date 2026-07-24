import type {
  VerificationFailureDTO,
  VerificationResponseDTO,
  VerificationSuccessDTO,
} from "./verification.dto";
import { findApplicationForVerification } from "./verification.repository";
import {
  toPublicVolunteerId,
  volunteerIdToApplicationNumber,
} from "./verification.validators";

export type VerificationOutcome =
  | { kind: "success"; body: VerificationSuccessDTO }
  | { kind: "not_found"; body: VerificationFailureDTO }
  | { kind: "inactive"; body: VerificationFailureDTO };

const isActiveVolunteer = (app: {
  status: string;
  paymentStatus: string;
}): boolean => app.status === "SUBMITTED" && app.paymentStatus === "PAID";

/**
 * Public Gram Sahakari verification.
 * Authorization is intentionally absent — anyone with a Volunteer ID may verify.
 */
export const verifyVolunteer = async (
  volunteerIdInput: string
): Promise<VerificationOutcome> => {
  const applicationNumber = volunteerIdToApplicationNumber(volunteerIdInput);
  const application = await findApplicationForVerification(applicationNumber);

  if (!application) {
    return {
      kind: "not_found",
      body: { verified: false, message: "Volunteer not found." },
    };
  }

  if (!isActiveVolunteer(application)) {
    return {
      kind: "inactive",
      body: { verified: false, message: "Volunteer is inactive." },
    };
  }

  const issuedAt = application.submittedAt ?? application.createdAt;
  const body: VerificationSuccessDTO = {
    verified: true,
    volunteerId: toPublicVolunteerId(application.applicationNumber),
    name: (application.fullName ?? "").trim() || "Gram Sahakari",
    district: (application.district ?? "").trim() || "—",
    taluka: (application.taluka ?? "").trim() || "—",
    village: (application.village ?? "").trim() || "—",
    status: "ACTIVE",
    photoUrl: application.photo?.url ?? null,
    issuedAt: new Date(issuedAt).toISOString(),
    verifiedAt: new Date().toISOString(),
  };

  return { kind: "success", body };
};

/** Type guard helper for controllers that only need the DTO union. */
export const toVerificationResponse = (
  outcome: VerificationOutcome
): VerificationResponseDTO => outcome.body;
