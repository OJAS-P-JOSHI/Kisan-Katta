import { AppError } from "../../utils/AppError";
import { assertKnownCrops } from "../crop/crop.service";
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

const optionalNonEmptyString = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`${field} must be a non-empty string when provided.`, 400);
  }
  return value.trim();
};

/**
 * Accepts a positive integer LGD code from JSON number or numeric string.
 * Returns undefined when the field is absent.
 */
const optionalLgdCode = (value: unknown, field: string): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new AppError(`${field} must be a positive integer LGD code.`, 400);
    }
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim());
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
      throw new AppError(`${field} must be a positive integer LGD code.`, 400);
    }
    return parsed;
  }

  throw new AppError(`${field} must be a positive integer LGD code.`, 400);
};

const validateLanguage = (value: unknown): SupportedLanguage => {
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
  // Resolve to canonical Agmarknet names; reject unknown crops (legacy labels accepted).
  return assertKnownCrops(crops);
};

const hasDistrict = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.districtCode !== undefined ||
  (typeof body.district === "string" && body.district.length > 0);

const hasTaluka = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.talukaCode !== undefined ||
  (typeof body.taluka === "string" && body.taluka.length > 0);

const hasVillage = (body: CreateProfileBody | UpdateProfileBody): boolean =>
  body.villageCode !== undefined ||
  (typeof body.village === "string" && body.village.length > 0);

/**
 * Create requires a full hierarchy: district + taluka + village
 * (each via code and/or name).
 */
const assertCompleteLocationForCreate = (body: CreateProfileBody): void => {
  if (!hasDistrict(body)) {
    throw new AppError(
      "Missing district: provide districtCode or district name.",
      400
    );
  }
  if (!hasTaluka(body)) {
    throw new AppError(
      "Missing taluka: provide talukaCode or taluka name.",
      400
    );
  }
  if (!hasVillage(body)) {
    throw new AppError(
      "Missing village: provide villageCode or village name.",
      400
    );
  }
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const validateCreateProfile = (
  body: Record<string, unknown>
): CreateProfileBody => {
  const result: CreateProfileBody = {
    name: requireString(body["name"], "name"),
    favoriteCrops: validateFavoriteCrops(body["favoriteCrops"]),
    language: body["language"] !== undefined ? validateLanguage(body["language"]) : "mr",
  };

  const district = optionalNonEmptyString(body["district"], "district");
  const taluka = optionalNonEmptyString(body["taluka"], "taluka");
  const village = optionalNonEmptyString(body["village"], "village");
  const districtCode = optionalLgdCode(body["districtCode"], "districtCode");
  const talukaCode = optionalLgdCode(body["talukaCode"], "talukaCode");
  const villageCode = optionalLgdCode(body["villageCode"], "villageCode");

  if (district !== undefined) result.district = district;
  if (taluka !== undefined) result.taluka = taluka;
  if (village !== undefined) result.village = village;
  if (districtCode !== undefined) result.districtCode = districtCode;
  if (talukaCode !== undefined) result.talukaCode = talukaCode;
  if (villageCode !== undefined) result.villageCode = villageCode;

  assertCompleteLocationForCreate(result);
  return result;
};

export const validateUpdateProfile = (
  body: Record<string, unknown>
): UpdateProfileBody => {
  const result: UpdateProfileBody = {};

  if (body["name"] !== undefined) result.name = requireString(body["name"], "name");
  if (body["favoriteCrops"] !== undefined) {
    result.favoriteCrops = validateFavoriteCrops(body["favoriteCrops"]);
  }
  if (body["language"] !== undefined) {
    result.language = validateLanguage(body["language"]);
  }

  const district = optionalNonEmptyString(body["district"], "district");
  const taluka = optionalNonEmptyString(body["taluka"], "taluka");
  const village = optionalNonEmptyString(body["village"], "village");
  const districtCode = optionalLgdCode(body["districtCode"], "districtCode");
  const talukaCode = optionalLgdCode(body["talukaCode"], "talukaCode");
  const villageCode = optionalLgdCode(body["villageCode"], "villageCode");

  if (district !== undefined) result.district = district;
  if (taluka !== undefined) result.taluka = taluka;
  if (village !== undefined) result.village = village;
  if (districtCode !== undefined) result.districtCode = districtCode;
  if (talukaCode !== undefined) result.talukaCode = talukaCode;
  if (villageCode !== undefined) result.villageCode = villageCode;

  if (Object.keys(result).length === 0) {
    throw new AppError("At least one field must be provided to update.", 400);
  }

  return result;
};
