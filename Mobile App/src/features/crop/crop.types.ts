/**
 * Crop Master DTOs — mirror backend `/api/v1/crops` responses.
 */

export type CropListItem = {
  cropId: number;
  name: string;
  nameMr: string;
};

/** Display-friendly crop for pickers (label prefers Marathi). */
export type CropOption = {
  cropId: number;
  name: string;
  nameMr: string;
  /** Marathi when available, otherwise English Agmarknet name. */
  label: string;
};
