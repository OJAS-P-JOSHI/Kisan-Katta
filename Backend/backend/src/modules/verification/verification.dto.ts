export interface VerificationSuccessDTO {
  verified: true;
  volunteerId: string;
  name: string;
  district: string;
  taluka: string;
  village: string;
  status: "ACTIVE";
  photoUrl: string | null;
  issuedAt: string;
  verifiedAt: string;
}

export interface VerificationFailureDTO {
  verified: false;
  message: string;
}

export type VerificationResponseDTO =
  | VerificationSuccessDTO
  | VerificationFailureDTO;

/** Lean projection used for public verification — never select sensitive fields. */
export interface VerificationApplicationLean {
  applicationNumber: string;
  fullName: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  status: string;
  paymentStatus: string;
  photo?: { url?: string } | null;
  submittedAt: Date | null;
  createdAt: Date;
}
