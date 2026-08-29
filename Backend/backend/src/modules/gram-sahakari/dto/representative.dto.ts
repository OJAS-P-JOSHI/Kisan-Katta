export type RepresentativeMatchLevel = "VILLAGE" | "TALUKA" | "DISTRICT";

/** Public contact card — no Aadhaar, bank, or payment fields. */
export interface RepresentativeContactDTO {
  name: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  photoUrl: string | null;
}

export interface RepresentativeDiscoveryDTO {
  /** False when profile location is incomplete or no paid rep was found. */
  available: boolean;
  matchLevel: RepresentativeMatchLevel | null;
  representatives: RepresentativeContactDTO[];
  /** True when farmer profile has district, taluka, and village. */
  profileComplete: boolean;
}
