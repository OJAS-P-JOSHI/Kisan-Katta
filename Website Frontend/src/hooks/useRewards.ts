import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  cancelReward,
  createReward,
  getRepresentativeRewards,
  getReward,
  getRewardSummary,
  listRewards,
  markRewardPaid,
  updateReward,
} from '@/api/reward.api'
import type {
  CreateRewardInput,
  MarkPaidInput,
  RewardListQuery,
  UpdateRewardInput,
} from '@/types/reward.types'

export const rewardKeys = {
  all: ['rewards'] as const,
  lists: () => [...rewardKeys.all, 'list'] as const,
  list: (query?: RewardListQuery) =>
    [...rewardKeys.lists(), query ?? {}] as const,
  summary: () => [...rewardKeys.all, 'summary'] as const,
  detail: (id: string) => [...rewardKeys.all, 'detail', id] as const,
  representative: (applicationId: string) =>
    [...rewardKeys.all, 'representative', applicationId] as const,
}

export const useRewards = (query: RewardListQuery) =>
  useQuery({
    queryKey: rewardKeys.list(query),
    queryFn: () => listRewards(query),
    placeholderData: (prev) => prev,
  })

export const useRewardSummary = () =>
  useQuery({
    queryKey: rewardKeys.summary(),
    queryFn: getRewardSummary,
    staleTime: 30_000,
  })

export const useReward = (id: string) =>
  useQuery({
    queryKey: rewardKeys.detail(id),
    queryFn: () => getReward(id),
    enabled: Boolean(id),
  })

export const useRepresentativeRewards = (applicationId: string) =>
  useQuery({
    queryKey: rewardKeys.representative(applicationId),
    queryFn: () => getRepresentativeRewards(applicationId),
    enabled: Boolean(applicationId),
  })

const invalidateRewards = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: rewardKeys.all })
  void qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
}

export const useCreateReward = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRewardInput) => createReward(input),
    onSuccess: () => invalidateRewards(qc),
  })
}

export const useUpdateReward = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRewardInput }) =>
      updateReward(id, input),
    onSuccess: () => invalidateRewards(qc),
  })
}

export const useMarkRewardPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MarkPaidInput }) =>
      markRewardPaid(id, input),
    onSuccess: () => invalidateRewards(qc),
  })
}

export const useCancelReward = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string | null }) =>
      cancelReward(id, notes),
    onSuccess: () => invalidateRewards(qc),
  })
}
