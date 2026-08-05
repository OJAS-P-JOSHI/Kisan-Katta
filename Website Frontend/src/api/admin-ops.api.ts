import { api } from '@/api/axios'
import type { ApiSuccessResponse } from '@/types/auth.types'

const BASE = '/api/v1/admin'

const toParams = (query?: Record<string, unknown>): Record<string, string> => {
  if (!query) return {}
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params[key] = String(value)
  }
  return params
}

export const adminUnifiedSearch = async (q: string) => {
  const { data } = await api.get<ApiSuccessResponse<{ query: string; hits: Array<{
    type: string
    label: string
    subtitle: string
    userId: string | null
    entityId: string
    href: string
  }> }>>(`${BASE}/search`, { params: { q } })
  return data.data
}

export const getUserVault = async (userId: string) => {
  const { data } = await api.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/users/${userId}/vault`,
  )
  return data.data
}

export const getAdminOpsDashboard = async () => {
  const { data } = await api.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/dashboard/ops`,
  )
  return data.data
}

export const listAdminSubscriptions = async (query?: Record<string, unknown>) => {
  const { data } = await api.get<ApiSuccessResponse<{
    items: Array<Record<string, unknown>>
    page: number
    limit: number
    total: number
    totalPages: number
  }>>(`${BASE}/subscriptions`, { params: toParams(query) })
  return data.data
}

export const getAdminSubscription = async (id: string) => {
  const { data } = await api.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/subscriptions/${id}`,
  )
  return data.data
}

export const syncAdminSubscription = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/subscriptions/${id}/sync`,
    { reason },
  )
  return data.data
}

export const cancelAdminSubscription = async (
  userId: string,
  cancelAtCycleEnd: boolean,
  reason?: string,
) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/users/${userId}/subscriptions/cancel`,
    { cancelAtCycleEnd, reason },
  )
  return data.data
}

export const refundAdminSubscription = async (
  userId: string,
  body: {
    reason: string
    paymentId?: string
    amountPaise?: number
    subscriptionId?: string
  },
) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/users/${userId}/subscriptions/refund`,
    body,
  )
  return data.data
}

export const grantFreeMonthAdmin = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/subscriptions/${id}/grant-free-month`,
    { reason },
  )
  return data.data
}

export const deactivatePremiumAdmin = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/subscriptions/${id}/deactivate`,
    { reason },
  )
  return data.data
}

export const listAdminMarketplace = async (query?: Record<string, unknown>) => {
  const { data } = await api.get<ApiSuccessResponse<{
    items: Array<Record<string, unknown>>
    page: number
    limit: number
    total: number
    totalPages: number
  }>>(`${BASE}/marketplace`, { params: toParams(query) })
  return data.data
}

export const getAdminMarketplaceListing = async (id: string) => {
  const { data } = await api.get<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/marketplace/${id}`,
  )
  return data.data
}

export const archiveAdminMarketplace = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/marketplace/${id}/archive`,
    { reason },
  )
  return data.data
}

export const restoreAdminMarketplace = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/marketplace/${id}/restore`,
    { reason },
  )
  return data.data
}

export const deleteAdminMarketplace = async (id: string, reason?: string) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/marketplace/${id}/delete`,
    { reason },
  )
  return data.data
}

export const listPaymentCenter = async (query?: Record<string, unknown>) => {
  const { data } = await api.get<ApiSuccessResponse<{
    items: Array<Record<string, unknown>>
    page: number
    limit: number
    total: number
    totalPages: number
  }>>(`${BASE}/payments/center`, { params: toParams(query) })
  return data.data
}

export const getAdminNotifications = async () => {
  const { data } = await api.get<ApiSuccessResponse<{
    items: Array<Record<string, unknown>>
    unreadApprox: number
  }>>(`${BASE}/notifications`)
  return data.data
}

export const exportAdminReport = (type: string): string =>
  `${BASE}/reports/export/${type}`

export const reconcileAdminApplication = async (
  applicationId: string,
  reason?: string,
) => {
  const { data } = await api.post<ApiSuccessResponse<Record<string, unknown>>>(
    `${BASE}/applications/${applicationId}/reconcile`,
    { reason },
  )
  return data.data
}
