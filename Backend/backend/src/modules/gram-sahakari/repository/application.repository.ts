import { Types } from "mongoose";
import { GramSahakariApplication } from "../gram-sahakari.model";
import { BLOCKING_APPLICATION_STATUSES } from "../gram-sahakari.constants";
import type { IGramSahakariApplication } from "../interfaces/application.interface";
import type { AdminApplicationsQuery } from "../types/application.types";
import { buildExcludeUnstartedDraftsFilter } from "../utils/application-progress";

export const findApplicationByUserId = (
  userId: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOne({ userId: new Types.ObjectId(userId) }).lean();

export const findApplicationById = (
  applicationId: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findById(applicationId).lean();

export const findBlockingApplicationByUserId = (
  userId: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOne({
    userId: new Types.ObjectId(userId),
    status: { $in: BLOCKING_APPLICATION_STATUSES },
  }).lean();

export const createDraftApplication = (
  userId: string,
  applicationNumber: string,
  phone: string
): Promise<IGramSahakariApplication> =>
  GramSahakariApplication.create({
    userId: new Types.ObjectId(userId),
    applicationNumber,
    phone,
  });

export const findApplicationByNumber = (
  applicationNumber: string
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findOne({ applicationNumber }).lean();

export const updateApplicationById = (
  applicationId: string,
  update: Partial<IGramSahakariApplication>
): Promise<IGramSahakariApplication | null> =>
  GramSahakariApplication.findByIdAndUpdate(applicationId, update, {
    returnDocument: "after",
    runValidators: true,
  }).lean();

export const findApplications = async (
  query: AdminApplicationsQuery
): Promise<{ items: IGramSahakariApplication[]; total: number }> => {
  const filter: Record<string, unknown> = {};
  const andConditions: Record<string, unknown>[] = [];

  if (query.district) {
    filter.district = query.district;
  }

  if (query.taluka) {
    filter.taluka = query.taluka;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.fromDate || query.toDate) {
    const submittedAt: Record<string, Date> = {};
    if (query.fromDate) {
      submittedAt.$gte = new Date(query.fromDate);
    }
    if (query.toDate) {
      submittedAt.$lte = new Date(query.toDate);
    }
    filter.submittedAt = submittedAt;
  }

  if (query.search) {
    const searchRegex = new RegExp(
      query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );
    filter.$or = [
      { applicationNumber: searchRegex },
      { fullName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { village: searchRegex },
      { taluka: searchRegex },
    ];
  }

  // Default: hide placeholder DRAFTs (status=DRAFT && !hasStartedApplication()).
  // Opt in with showDrafts=true to include empty placeholders.
  if (!query.showDrafts) {
    andConditions.push(buildExcludeUnstartedDraftsFilter());
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    GramSahakariApplication.find(filter)
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IGramSahakariApplication[]>(),
    GramSahakariApplication.countDocuments(filter),
  ]);

  return { items, total };
};

export const saveApplicationDocument = async (
  applicationId: string,
  update: Partial<IGramSahakariApplication>
): Promise<IGramSahakariApplication | null> => {
  const doc = await GramSahakariApplication.findById(applicationId);
  if (!doc) return null;

  Object.assign(doc, update);
  await doc.save();
  return doc.toObject();
};
