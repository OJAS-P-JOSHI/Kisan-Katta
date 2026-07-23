import { api } from '@/api/axios'
import type { ApplicationDTO } from '@/types/application.types'
import type { ApiSuccessResponse } from '@/types/auth.types'
import type {
  AdminListQuery,
  AdminProfile,
  AnalyticsSummary,
  DashboardSummary,
  FarmerDetail,
  PaginatedApplications,
  PaginatedFarmers,
  PaginatedPayments,
  PaginatedVolunteers,
  SystemInfo,
} from '@/types/admin.types'

const BASE = '/api/v1/admin'

const toParams = (query?: AdminListQuery): Record<string, string> => {
  if (!query) return {}
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params[key] = String(value)
  }
  return params
}

export const getAdminMe = async (): Promise<AdminProfile> => {
  const { data } = await api.get<ApiSuccessResponse<AdminProfile>>(`${BASE}/me`)
  return data.data
}

export const getAdminDashboard = async (): Promise<DashboardSummary> => {
  const { data } = await api.get<ApiSuccessResponse<DashboardSummary>>(
    `${BASE}/dashboard`,
  )
  return data.data
}

export const getAdminAnalytics = async (): Promise<AnalyticsSummary> => {
  const { data } = await api.get<ApiSuccessResponse<AnalyticsSummary>>(
    `${BASE}/analytics`,
  )
  return data.data
}

export const listAdminApplications = async (
  query?: AdminListQuery,
): Promise<PaginatedApplications> => {
  const { data } = await api.get<ApiSuccessResponse<PaginatedApplications>>(
    `${BASE}/applications`,
    { params: toParams(query) },
  )
  return data.data
}

export const getAdminApplication = async (
  id: string,
): Promise<ApplicationDTO> => {
  const { data } = await api.get<ApiSuccessResponse<ApplicationDTO>>(
    `${BASE}/applications/${id}`,
  )
  return data.data
}

export const listAdminVolunteers = async (
  query?: AdminListQuery,
): Promise<PaginatedVolunteers> => {
  const { data } = await api.get<ApiSuccessResponse<PaginatedVolunteers>>(
    `${BASE}/volunteers`,
    { params: toParams(query) },
  )
  return data.data
}

export const listAdminPayments = async (
  query?: AdminListQuery,
): Promise<PaginatedPayments> => {
  const { data } = await api.get<ApiSuccessResponse<PaginatedPayments>>(
    `${BASE}/payments`,
    { params: toParams(query) },
  )
  return data.data
}

export const listAdminFarmers = async (
  query?: AdminListQuery,
): Promise<PaginatedFarmers> => {
  const { data } = await api.get<ApiSuccessResponse<PaginatedFarmers>>(
    `${BASE}/farmers`,
    { params: toParams(query) },
  )
  return data.data
}

export const getAdminFarmer = async (id: string): Promise<FarmerDetail> => {
  const { data } = await api.get<ApiSuccessResponse<FarmerDetail>>(
    `${BASE}/farmers/${id}`,
  )
  return data.data
}

export const getAdminSystemInfo = async (): Promise<SystemInfo> => {
  const { data } = await api.get<ApiSuccessResponse<SystemInfo>>(
    `${BASE}/system`,
  )
  return data.data
}
