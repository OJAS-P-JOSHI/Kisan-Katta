import { AppError } from "../../utils/AppError";
import { SUPPORTED_LANGUAGES } from "./profile.types";
import type { CreateProfileBody, SupportedLanguage, UpdateProfileBody } from "./profile.types";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const requireString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} is required and must be a non-empty string.`, 400);
  }
  return value.trim();
};

const validateLanguage = (value: unknown): SupportedLanguage => {
  // Explicit comparison is the most TypeScript-strict-compatible approach
  if (value !== "mr" && value !== "en" && value !== "hi") {
    throw new AppError(
      `language must be one of: ${SUPPORTED_LANGUAGES.join(", ")}.`,
      400
    );
  }
  return value;
};

const validateFavoriteCrops = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    throw new AppError("favoriteCrops must be an array.", 400);
  }
  if (value.length === 0 || value.length > 10) {
    throw new AppError("favoriteCrops must have between 1 and 10 crops.", 400);
  }
  const crops: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      throw new AppError("Each crop in favoriteCrops must be a non-empty string.", 400);
    }
    crops.push(item.trim());
  }
  return crops;
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreateProfile = (body: Record<string, unknown>): CreateProfileBody => ({
  name: requireString(body["name"], "name"),
  district: requireString(body["district"], "district"),
  taluka: requireString(body["taluka"], "taluka"),
  village: requireString(body["village"], "village"),
  favoriteCrops: validateFavoriteCrops(body["favoriteCrops"]),
  // language defaults to "mr" when omitted
  language: body["language"] !== undefined ? validateLanguage(body["language"]) : "mr",
});

export const validateUpdateProfile = (body: Record<string, unknown>): UpdateProfileBody => {
  const result: UpdateProfileBody = {};

  if (body["name"] !== undefined) result.name = requireString(body["name"], "name");
  if (body["district"] !== undefined) result.district = requireString(body["district"], "district");
  if (body["taluka"] !== undefined) result.taluka = requireString(body["taluka"], "taluka");
  if (body["village"] !== undefined) result.village = requireString(body["village"], "village");
  if (body["favoriteCrops"] !== undefined) result.favoriteCrops = validateFavoriteCrops(body["favoriteCrops"]);
  if (body["language"] !== undefined) result.language = validateLanguage(body["language"]);

  if (Object.keys(result).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return result;
};
