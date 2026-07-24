import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import type { VerificationApplicationLean } from "./verification.dto";

/**
 * Public verification lookup — projects ONLY safe fields.
 * Never select Aadhaar, bank, phone, email, address, payment IDs, or userId.
 */
export const findApplicationForVerification = (
  applicationNumber: string
): Promise<VerificationApplicationLean | null> =>
  GramSahakariApplication.findOne({ applicationNumber })
    .select(
      "applicationNumber fullName district taluka village status paymentStatus photo.url submittedAt createdAt"
    )
    .lean<VerificationApplicationLean>()
    .exec();
