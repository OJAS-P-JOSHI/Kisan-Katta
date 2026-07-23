import { useQuery } from '@tanstack/react-query'

import {
  getAdminAnalytics,
  getAdminApplication,
  getAdminDashboard,
  getAdminFarmer,
  getAdminMe,
  getAdminSystemInfo,
  listAdminApplications,
  listAdminFarmers,
  listAdminPayments,
  listAdminVolunteers,
} from '@/api/admin.api'
import type { AdminListQuery } from '@/types/admin.types'

export const adminKeys = {
  all: ['admin'] as const,
  me: () => [...adminKeys.all, 'me'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  system: () => [...adminKeys.all, 'system'] as const,
  applications: (query?: AdminListQuery) =>
    [...adminKeys.all, 'applications', query ?? {}] as const,
  application: (id: string) => [...adminKeys.all, 'application', id] as const,
  volunteers: (query?: AdminListQuery) =>
    [...adminKeys.all, 'volunteers', query ?? {}] as const,
  payments: (query?: AdminListQuery) =>
    [...adminKeys.all, 'payments', query ?? {}] as const,
  farmers: (query?: AdminListQuery) =>
    [...adminKeys.all, 'farmers', query ?? {}] as const,
  farmer: (id: string) => [...adminKeys.all, 'farmer', id] as const,
}

export const useAdminMe = () =>
  useQuery({ queryKey: adminKeys.me(), queryFn: getAdminMe, staleTime: 60_000 })

export const useAdminDashboard = () =>
  useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: getAdminDashboard,
    staleTime: 30_000,
  })

export const useAdminAnalytics = () =>
  useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: getAdminAnalytics,
    staleTime: 60_000,
  })

export const useAdminSystemInfo = () =>
  useQuery({
    queryKey: adminKeys.system(),
    queryFn: getAdminSystemInfo,
    staleTime: 60_000,
  })

export const useAdminApplications = (query: AdminListQuery) =>
  useQuery({
    queryKey: adminKeys.applications(query),
    queryFn: () => listAdminApplications(query),
    placeholderData: (prev) => prev,
  })

export const useAdminApplication = (id: string) =>
  useQuery({
    queryKey: adminKeys.application(id),
    queryFn: () => getAdminApplication(id),
    enabled: Boolean(id),
  })

export const useAdminVolunteers = (query: AdminListQuery) =>
  useQuery({
    queryKey: adminKeys.volunteers(query),
    queryFn: () => listAdminVolunteers(query),
    placeholderData: (prev) => prev,
  })

export const useAdminPayments = (query: AdminListQuery) =>
  useQuery({
    queryKey: adminKeys.payments(query),
    queryFn: () => listAdminPayments(query),
    placeholderData: (prev) => prev,
  })

export const useAdminFarmers = (query: AdminListQuery) =>
  useQuery({
    queryKey: adminKeys.farmers(query),
    queryFn: () => listAdminFarmers(query),
    placeholderData: (prev) => prev,
  })

export const useAdminFarmer = (id: string) =>
  useQuery({
    queryKey: adminKeys.farmer(id),
    queryFn: () => getAdminFarmer(id),
    enabled: Boolean(id),
  })
