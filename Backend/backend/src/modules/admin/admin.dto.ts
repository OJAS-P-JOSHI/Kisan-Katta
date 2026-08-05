import type { AdminPermission, AdminRole } from "./admin.constants";

export interface AdminAddressDTO {
  line1: string;
  taluka: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AdminProfileDTO {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  address: AdminAddressDTO;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface DashboardSummaryDTO {
  totalApplications: number;
  draft: number;
  paymentPending: number;
  submitted: number;
  totalFarmers: number;
  totalGramSahakaris: number;
  totalRevenuePaise: number;
  totalRevenueInr: number;
  todayRegistrations: number;
  monthRegistrations: number;
  paidCount: number;
  paymentSuccessRate: number;
  recentApplications: Array<{
    id: string;
    applicationNumber: string;
    fullName: string | null;
    phoneNumber: string | null;
    district: string | null;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  recentFarmers: Array<{
    id: string;
    name: string;
    mobile: string | null;
    district: string;
    village: string;
    registeredAt: string;
    accountStatus: "ACTIVE" | "INACTIVE";
  }>;
}

export interface FarmerListItemDTO {
  id: string;
  userId: string;
  name: string;
  mobile: string | null;
  photoUrl: string | null;
  village: string;
  taluka: string;
  district: string;
  state: string;
  registeredAt: string;
  language: string;
  languageLabel: string;
  favoriteCrops: string[];
  lastActiveAt: string | null;
  accountStatus: "ACTIVE" | "INACTIVE";
  role: string;
}

export interface PaginatedFarmersDTO {
  items: FarmerListItemDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FarmerDetailDTO extends FarmerListItemDTO {
  email: string | null;
  gender: string | null;
  dob: string | null;
  pincode: string | null;
  farmSize: string | null;
  farmingType: string | null;
  device: string | null;
  isVerified: boolean;
  isProfileCompleted: boolean;
  updatedAt: string;
  activity: {
    applications: number;
    orders: null;
    communityPosts: null;
    marketplaceListings: null;
    weatherUsage: null;
  };
}

export interface SystemInfoDTO {
  backendVersion: string;
  frontendVersion: string;
  databaseStatus: string;
  apiStatus: string;
  serverTime: string;
  environment: string;
  authUsers: number;
  farmerProfiles: number;
}

export interface AnalyticsSummaryDTO {
  revenueInr: number;
  applications: number;
  paymentSuccessRate: number;
  monthlyGrowth: Array<{ month: string; applications: number; revenueInr: number }>;
  districtDistribution: Array<{ district: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}

/** Farmer profile location drill-down: district → taluka → village. */
export interface AnalyticsLocationBreakdownDTO {
  source: "farmers";
  level: "district" | "taluka" | "village";
  district: string | null;
  taluka: string | null;
  items: Array<{ name: string; count: number }>;
  totalInScope: number;
}

export interface PaymentListItemDTO {
  applicationId: string;
  applicationNumber: string;
  fullName: string | null;
  amountPaise: number;
  amountInr: number;
  paymentStatus: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  paidAt: string | null;
  updatedAt: string;
}

export interface PaginatedPaymentsDTO {
  items: PaymentListItemDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface VolunteerListItemDTO {
  id: string;
  applicationNumber: string;
  volunteerId: string;
  fullName: string | null;
  phone: string | null;
  phoneNumber: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  submittedAt: string | null;
  photoUrl: string | null;
}

export interface PaginatedVolunteersDTO {
  items: VolunteerListItemDTO[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
