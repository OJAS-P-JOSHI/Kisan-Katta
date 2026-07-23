import type { AdminPermission, AdminRole } from './admin.constants'

export type { AdminPermission, AdminRole }

export type AdminAddress = {
  line1: string
  taluka: string
  district: string
  city: string
  state: string
  pincode: string
}

export type AdminProfile = {
  id: string
  name: string
  phoneNumber: string
  email: string
  role: AdminRole
  permissions: AdminPermission[]
  isActive: boolean
  address: AdminAddress
  lastLoginAt: string | null
  createdAt: string
}

export type DashboardSummary = {
  totalApplications: number
  draft: number
  paymentPending: number
  submitted: number
  totalRevenuePaise: number
  totalRevenueInr: number
  todayRegistrations: number
  monthRegistrations: number
  paidCount: number
  paymentSuccessRate: number
  recentApplications: Array<{
    id: string
    applicationNumber: string
    fullName: string | null
    district: string | null
    status: string
    paymentStatus: string
    createdAt: string
  }>
}

export type AnalyticsSummary = {
  revenueInr: number
  applications: number
  paymentSuccessRate: number
  monthlyGrowth: Array<{ month: string; applications: number; revenueInr: number }>
  districtDistribution: Array<{ district: string; count: number }>
  statusBreakdown: Array<{ status: string; count: number }>
}

export type PaymentListItem = {
  applicationId: string
  applicationNumber: string
  fullName: string | null
  amountPaise: number
  amountInr: number
  paymentStatus: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  paidAt: string | null
  updatedAt: string
}

export type PaginatedPayments = {
  items: PaymentListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type VolunteerListItem = {
  id: string
  applicationNumber: string
  volunteerId: string
  fullName: string | null
  phone: string | null
  district: string | null
  taluka: string | null
  village: string | null
  submittedAt: string | null
  photoUrl: string | null
}

export type PaginatedVolunteers = {
  items: VolunteerListItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ApplicationSummary = {
  id: string
  applicationNumber: string
  userId: string
  status: string
  fullName: string | null
  phone: string | null
  district: string | null
  taluka: string | null
  village: string | null
  paymentStatus: string
  submittedAt: string | null
  createdAt: string
}

export type PaginatedApplications = {
  items: ApplicationSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminListQuery = {
  page?: number
  limit?: number
  search?: string
  district?: string
  taluka?: string
  status?: string
  paymentStatus?: string
  fromDate?: string
  toDate?: string
}
