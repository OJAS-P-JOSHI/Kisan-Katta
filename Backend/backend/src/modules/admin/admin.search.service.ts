import { Types, type HydratedDocument } from "mongoose";
import { AppError } from "../../utils/AppError";
import { AuthUser } from "../auth/auth.model";
import { FarmerProfile } from "../profile/profile.model";
import { GramSahakariApplication } from "../gram-sahakari/gram-sahakari.model";
import { HelpRequest } from "../assistance/assistance.model";
import {
  MarketplaceListing,
  MarketplaceSaved,
} from "../marketplace/marketplace.model";
import { UserSubscription } from "../subscription/subscription.model";
import {
  toBillingPaymentDTO,
  toSubscriptionDTO,
} from "../subscription/dto/subscription.dto";
import { hasSubscriptionAccess } from "../subscription/utils/access";
import type { IUserSubscription } from "../subscription/interfaces/subscription.interface";
import { toListingDTO } from "../marketplace/marketplace.service";
import type { IMarketplaceListing } from "../marketplace/marketplace.types";

export interface UnifiedSearchHitDTO {
  type:
    | "USER"
    | "SUBSCRIPTION"
    | "PAYMENT"
    | "APPLICATION";
  label: string;
  subtitle: string;
  userId: string | null;
  entityId: string;
  href: string;
}

export interface UnifiedSearchResultDTO {
  query: string;
  hits: UnifiedSearchHitDTO[];
}

const isObjectId = (value: string): boolean => Types.ObjectId.isValid(value);

const normalizeMobile = (q: string): string | null => {
  const digits = q.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (q.startsWith("+") && digits.length >= 10) return `+${digits}`;
  return null;
};

export const unifiedAdminSearch = async (
  rawQuery: string
): Promise<UnifiedSearchResultDTO> => {
  const query = rawQuery.trim();
  if (query.length < 2) {
    throw new AppError("Search query must be at least 2 characters.", 400);
  }

  const hits: UnifiedSearchHitDTO[] = [];
  const seen = new Set<string>();
  const push = (hit: UnifiedSearchHitDTO) => {
    const key = `${hit.type}:${hit.entityId}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(hit);
  };

  const mobile = normalizeMobile(query);

  // Mobile / AuthUser by id
  if (mobile) {
    const user = await AuthUser.findOne({ mobile }).lean();
    if (user) {
      const profile = await FarmerProfile.findOne({ userId: user._id }).lean();
      push({
        type: "USER",
        label: profile?.name ?? user.mobile,
        subtitle: user.mobile,
        userId: String(user._id),
        entityId: String(user._id),
        href: `/admin/users/${user._id}`,
      });
    }
  }

  if (isObjectId(query)) {
    const user = await AuthUser.findById(query).lean();
    if (user) {
      const profile = await FarmerProfile.findOne({ userId: user._id }).lean();
      push({
        type: "USER",
        label: profile?.name ?? user.mobile,
        subtitle: user.mobile,
        userId: String(user._id),
        entityId: String(user._id),
        href: `/admin/users/${user._id}`,
      });
    }

    const profile = await FarmerProfile.findById(query).lean();
    if (profile) {
      push({
        type: "USER",
        label: profile.name,
        subtitle: String(profile.userId),
        userId: String(profile.userId),
        entityId: String(profile.userId),
        href: `/admin/users/${profile.userId}`,
      });
    }
  }

  // Name search
  const nameProfiles = await FarmerProfile.find({
    name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  })
    .limit(10)
    .lean();
  for (const profile of nameProfiles) {
    push({
      type: "USER",
      label: profile.name,
      subtitle: `${profile.village}, ${profile.district}`,
      userId: String(profile.userId),
      entityId: String(profile.userId),
      href: `/admin/users/${profile.userId}`,
    });
  }

  // Subscription id / customer id
  const subs = await UserSubscription.find({
    $or: [
      { subscriptionId: query },
      { customerId: query },
      ...(isObjectId(query) ? [{ _id: new Types.ObjectId(query) }] : []),
    ],
  })
    .limit(10)
    .lean<IUserSubscription[]>();
  for (const sub of subs) {
    push({
      type: "SUBSCRIPTION",
      label: `Subscription ${sub.subscriptionId ?? sub._id}`,
      subtitle: `Status ${sub.status}`,
      userId: String(sub.userId),
      entityId: String(sub._id),
      href: `/admin/users/${sub.userId}?tab=subscription`,
    });
  }

  // Billing payment id or GS payment id
  const subByPayment = await UserSubscription.find({
    $or: [
      { "billingPayments.paymentId": query },
      { latestPaymentId: query },
    ],
  })
    .limit(5)
    .lean<IUserSubscription[]>();
  for (const sub of subByPayment) {
    push({
      type: "PAYMENT",
      label: `Sub payment ${query}`,
      subtitle: `User ${sub.userId}`,
      userId: String(sub.userId),
      entityId: query,
      href: `/admin/users/${sub.userId}?tab=payments`,
    });
  }

  const gsByPayment = await GramSahakariApplication.find({
    $or: [
      { razorpayPaymentId: query },
      { razorpayOrderId: query },
      { applicationNumber: query.toUpperCase() },
      { refundId: query },
    ],
  })
    .limit(10)
    .lean();
  for (const app of gsByPayment) {
    push({
      type: "APPLICATION",
      label: app.applicationNumber,
      subtitle: `${app.fullName ?? "Applicant"} · ${app.paymentStatus}`,
      userId: String(app.userId),
      entityId: String(app._id),
      href: `/admin/gram-sahakari/${app._id}`,
    });
  }

  return { query, hits: hits.slice(0, 40) };
};

export const getUserVault = async (userId: string) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id.", 400);
  }

  const user = await AuthUser.findById(userId).lean();
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const [
    profile,
    subscriptions,
    listings,
    savedCount,
    helpRequests,
    applications,
  ] = await Promise.all([
    FarmerProfile.findOne({ userId: user._id }).lean(),
    UserSubscription.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .lean<IUserSubscription[]>(),
    MarketplaceListing.find({ sellerId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    MarketplaceSaved.countDocuments({ userId: user._id }),
    HelpRequest.find({ "author.userId": user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    GramSahakariApplication.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .lean(),
  ]);

  const latestSub = subscriptions[0] ?? null;
  const billingPayments = (latestSub?.billingPayments ?? [])
    .slice()
    .sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    )
    .map(toBillingPaymentDTO);

  const productListings = listings.filter((l) => l.listingType !== "labour");
  const labourListings = listings.filter((l) => l.listingType === "labour");

  const timeline = [
    ...subscriptions.flatMap((s) =>
      (s.events ?? []).map((e) => ({
        at: e.timestamp,
        source: "subscription" as const,
        type: e.type,
        details: e.details ?? {},
      }))
    ),
    ...applications.flatMap((a) =>
      (a.paymentEvents ?? []).map((e) => ({
        at: e.timestamp,
        source: "gram_sahakari" as const,
        type: e.type,
        details: e.details ?? {},
      }))
    ),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 100)
    .map((e) => ({
      at: new Date(e.at).toISOString(),
      source: e.source,
      type: e.type,
      details: e.details,
    }));

  return {
    user: {
      id: String(user._id),
      mobile: user.mobile,
      role: user.role,
      isVerified: user.isVerified,
      isProfileCompleted: user.isProfileCompleted,
      lastLoginAt: user.lastLoginAt
        ? new Date(user.lastLoginAt).toISOString()
        : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    profile: profile
      ? {
          id: String(profile._id),
          name: profile.name,
          district: profile.district,
          taluka: profile.taluka,
          village: profile.village,
          favoriteCrops: profile.favoriteCrops,
          language: profile.language,
          photoUrl: profile.profileImage?.url ?? null,
        }
      : null,
    subscription: latestSub
      ? {
          ...toSubscriptionDTO(latestSub),
          events: (latestSub.events ?? []).map((e) => ({
            type: e.type,
            source: e.source,
            details: e.details ?? {},
            timestamp: new Date(e.timestamp).toISOString(),
          })),
          billingPayments,
        }
      : null,
    subscriptionHistory: subscriptions.map((s) => toSubscriptionDTO(s)),
    paymentHistory: billingPayments,
    marketplace: {
      product: productListings.map((doc) =>
        toListingDTO(doc as HydratedDocument<IMarketplaceListing>)
      ),
      labour: labourListings.map((doc) =>
        toListingDTO(doc as HydratedDocument<IMarketplaceListing>)
      ),
      savedCount,
    },
    assistance: helpRequests.map((r) => ({
      id: String(r._id),
      title: r.title,
      status: r.status,
      supportCount: r.supportCount,
      reportCount: r.reportCount,
      createdAt: r.createdAt.toISOString(),
    })),
    gramSahakari: applications.map((a) => ({
      id: String(a._id),
      applicationNumber: a.applicationNumber,
      status: a.status,
      paymentStatus: a.paymentStatus,
      razorpayOrderId: a.razorpayOrderId,
      razorpayPaymentId: a.razorpayPaymentId,
      refundId: a.refundId ?? null,
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : null,
      updatedAt: a.updatedAt.toISOString(),
    })),
    supportSummary: {
      isPremiumActive: hasSubscriptionAccess(latestSub),
      subscriptionStatus: latestSub?.status ?? null,
      latestPaymentId: latestSub?.latestPaymentId ?? null,
      gsStatus: applications[0]?.status ?? null,
      gsPaymentStatus: applications[0]?.paymentStatus ?? null,
      openHelpRequests: helpRequests.filter((r) => r.status === "OPEN").length,
      activeListings: listings.filter((l) => l.status === "ACTIVE").length,
    },
    timeline,
  };
};
