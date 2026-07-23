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
    district: string | null;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export interface AnalyticsSummaryDTO {
  revenueInr: number;
  applications: number;
  paymentSuccessRate: number;
  monthlyGrowth: Array<{ month: string; applications: number; revenueInr: number }>;
  districtDistribution: Array<{ district: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
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
