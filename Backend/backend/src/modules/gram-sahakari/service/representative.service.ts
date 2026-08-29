import { Types } from "mongoose";
import { resolveDistrict } from "../../../config/maharashtraDistrictCoordinates";
import { AppError } from "../../../utils/AppError";
import { FarmerProfile } from "../../profile/profile.model";
import { GramSahakariApplication } from "../gram-sahakari.model";
import type {
  RepresentativeContactDTO,
  RepresentativeDiscoveryDTO,
  RepresentativeMatchLevel,
} from "../dto/representative.dto";

const MAX_REPRESENTATIVES = 3;

const PAID_REP_FILTER = {
  paymentStatus: "PAID" as const,
  status: "SUBMITTED" as const,
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const exactMatchRegex = (value: string): RegExp =>
  new RegExp(`^${escapeRegex(value.trim())}$`, "i");

const toContactDTO = (doc: {
  fullName?: string | null;
  phone?: string | null;
  village?: string | null;
  taluka?: string | null;
  district?: string | null;
  photo?: { url?: string } | null;
}): RepresentativeContactDTO | null => {
  const name = doc.fullName?.trim();
  const phone = doc.phone?.trim();
  if (!name || !phone) return null;

  return {
    name,
    phone,
    village: doc.village?.trim() ?? "",
    taluka: doc.taluka?.trim() ?? "",
    district: doc.district?.trim() ?? "",
    photoUrl: doc.photo?.url?.trim() ? doc.photo.url.trim() : null,
  };
};

const findPaidRepresentatives = async (
  filter: Record<string, unknown>,
  excludeUserId: string,
  limit: number
): Promise<RepresentativeContactDTO[]> => {
  const docs = await GramSahakariApplication.find({
    ...PAID_REP_FILTER,
    ...filter,
    userId: { $ne: new Types.ObjectId(excludeUserId) },
    phone: { $type: "string", $ne: "" },
    fullName: { $type: "string", $ne: "" },
  })
    .select("fullName phone village taluka district photo.url submittedAt")
    .sort({ submittedAt: -1 })
    .limit(limit)
    .lean();

  return docs
    .map((doc) => toContactDTO(doc))
    .filter((item): item is RepresentativeContactDTO => item !== null);
};

const resolveCanonicalDistrict = (district: string): string => {
  try {
    return resolveDistrict(district).district;
  } catch {
    return district.trim();
  }
};

const buildEmpty = (profileComplete: boolean): RepresentativeDiscoveryDTO => ({
  available: false,
  matchLevel: null,
  representatives: [],
  profileComplete,
});

const buildResult = (
  matchLevel: RepresentativeMatchLevel,
  representatives: RepresentativeContactDTO[],
  profileComplete: boolean
): RepresentativeDiscoveryDTO => ({
  available: representatives.length > 0,
  matchLevel: representatives.length > 0 ? matchLevel : null,
  representatives,
  profileComplete,
});

/**
 * Farmer-facing discovery: village → taluka → district fallback in one request.
 * Only paymentStatus PAID (and status SUBMITTED) applications are eligible.
 */
export const discoverRepresentativesForFarmer = async (
  userId: string
): Promise<RepresentativeDiscoveryDTO> => {
  const profile = await FarmerProfile.findOne({ userId }).lean();
  if (!profile) {
    throw new AppError("Profile not found. Complete your profile first.", 404);
  }

  const districtRaw = profile.district?.trim() ?? "";
  const talukaRaw = profile.taluka?.trim() ?? "";
  const villageRaw = profile.village?.trim() ?? "";

  const profileComplete =
    districtRaw.length > 0 && talukaRaw.length > 0 && villageRaw.length > 0;

  if (!profileComplete) {
    return buildEmpty(false);
  }

  const district = resolveCanonicalDistrict(districtRaw);

  const villageReps = await findPaidRepresentatives(
    {
      district,
      taluka: exactMatchRegex(talukaRaw),
      village: exactMatchRegex(villageRaw),
    },
    userId,
    MAX_REPRESENTATIVES
  );

  if (villageReps.length > 0) {
    return buildResult("VILLAGE", villageReps, true);
  }

  const talukaReps = await findPaidRepresentatives(
    {
      district,
      taluka: exactMatchRegex(talukaRaw),
    },
    userId,
    MAX_REPRESENTATIVES
  );

  if (talukaReps.length > 0) {
    return buildResult("TALUKA", talukaReps, true);
  }

  const districtReps = await findPaidRepresentatives(
    { district },
    userId,
    MAX_REPRESENTATIVES
  );

  if (districtReps.length > 0) {
    return buildResult("DISTRICT", districtReps, true);
  }

  return buildEmpty(true);
};
