/**
 * Location Master DTOs — mirror backend `/api/v1/location` responses.
 * Excel "Sub-District" is exposed as Taluka everywhere.
 */

export type LocationDistrict = {
  code: number;
  name: string;
  /** Optional Marathi name — supported when backend adds it. */
  nameMr?: string | null;
};

export type LocationTaluka = {
  code: number;
  name: string;
  /** Optional Marathi name — supported when backend adds it. */
  nameMr?: string | null;
};

export type LocationVillage = {
  code: number;
  name: string;
  nameMr: string;
  category: string;
  status: string;
};

/** Structured LGD block on ProfileResponseDTO.location */
export type ProfileLocationBlock = {
  district: { code: number | null; name: string; nameMr?: string | null };
  taluka: { code: number | null; name: string; nameMr?: string | null };
  village: { code: number | null; name: string; nameMr: string | null };
};
