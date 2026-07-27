import { api } from '@/api/axios'
import type { ApiSuccessResponse } from '@/types/auth.types'
import type {
  CreateRewardInput,
  MarkPaidInput,
  PaginatedRewards,
  RepresentativeRewardSummary,
  RewardDetail,
  RewardListQuery,
  RewardSummary,
  UpdateRewardInput,
} from '@/types/reward.types'

const BASE = '/api/v1/admin/rewards'

const toParams = (query?: RewardListQuery): Record<string, string> => {
  if (!query) return {}
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params[key] = String(value)
  }
  return params
}

export const listRewards = async (
  query?: RewardListQuery,
): Promise<PaginatedRewards> => {
  const { data } = await api.get<ApiSuccessResponse<PaginatedRewards>>(BASE, {
    params: toParams(query),
  })
  return data.data
}

export const getRewardSummary = async (): Promise<RewardSummary> => {
  const { data } = await api.get<ApiSuccessResponse<RewardSummary>>(
    `${BASE}/summary`,
  )
  return data.data
}

export const getReward = async (id: string): Promise<RewardDetail> => {
  const { data } = await api.get<ApiSuccessResponse<RewardDetail>>(
    `${BASE}/${id}`,
  )
  return data.data
}

export const getRepresentativeRewards = async (
  applicationId: string,
): Promise<RepresentativeRewardSummary> => {
  const { data } = await api.get<
    ApiSuccessResponse<RepresentativeRewardSummary>
  >(`${BASE}/by-representative/${applicationId}`)
  return data.data
}

export const createReward = async (
  input: CreateRewardInput,
): Promise<RewardDetail> => {
  const { data } = await api.post<ApiSuccessResponse<RewardDetail>>(
    BASE,
    input,
  )
  return data.data
}

export const updateReward = async (
  id: string,
  input: UpdateRewardInput,
): Promise<RewardDetail> => {
  const { data } = await api.patch<ApiSuccessResponse<RewardDetail>>(
    `${BASE}/${id}`,
    input,
  )
  return data.data
}

export const markRewardPaid = async (
  id: string,
  input: MarkPaidInput,
): Promise<RewardDetail> => {
  const { data } = await api.post<ApiSuccessResponse<RewardDetail>>(
    `${BASE}/${id}/mark-paid`,
    input,
  )
  return data.data
}

export const cancelReward = async (
  id: string,
  notes?: string | null,
): Promise<RewardDetail> => {
  const { data } = await api.post<ApiSuccessResponse<RewardDetail>>(
    `${BASE}/${id}/cancel`,
    { notes },
  )
  return data.data
}

export const exportRewardsCsvUrl = (query?: RewardListQuery): string => {
  const params = new URLSearchParams(toParams(query))
  const qs = params.toString()
  return qs ? `${BASE}/export?${qs}` : `${BASE}/export`
}

/** Download CSV via authenticated axios (not a plain link — needs JWT). */
export const downloadRewardsCsv = async (
  query?: RewardListQuery,
  filename = 'reward-history.csv',
): Promise<void> => {
  const { data } = await api.get<string>(`${BASE}/export`, {
    params: toParams(query),
    responseType: 'text',
  })
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
