import { api } from '@/api/axios'
import type { ApiSuccessResponse } from '@/types/auth.types'

import type {
  LocationDistrict,
  LocationTaluka,
  LocationVillage,
} from './location.types'

const ENDPOINTS = {
  districts: '/api/v1/location/districts',
  talukas: (districtCode: number) => `/api/v1/location/talukas/${districtCode}`,
  villages: (talukaCode: number) => `/api/v1/location/villages/${talukaCode}`,
} as const

// Module-level caches — same approach as Mobile App location.service.ts
let districtsCache: LocationDistrict[] | null = null
const talukasCache = new Map<number, LocationTaluka[]>()
const villagesCache = new Map<number, LocationVillage[]>()

/** GET /api/v1/location/districts */
export const fetchDistricts = async (): Promise<LocationDistrict[]> => {
  if (districtsCache) return districtsCache
  const { data } =
    await api.get<ApiSuccessResponse<LocationDistrict[]>>(ENDPOINTS.districts)
  districtsCache = data.data
  return districtsCache
}

/** GET /api/v1/location/talukas/:districtCode */
export const fetchTalukas = async (
  districtCode: number,
): Promise<LocationTaluka[]> => {
  const cached = talukasCache.get(districtCode)
  if (cached) return cached
  const { data } = await api.get<ApiSuccessResponse<LocationTaluka[]>>(
    ENDPOINTS.talukas(districtCode),
  )
  talukasCache.set(districtCode, data.data)
  return data.data
}

/** GET /api/v1/location/villages/:talukaCode */
export const fetchVillages = async (
  talukaCode: number,
): Promise<LocationVillage[]> => {
  const cached = villagesCache.get(talukaCode)
  if (cached) return cached
  const { data } = await api.get<ApiSuccessResponse<LocationVillage[]>>(
    ENDPOINTS.villages(talukaCode),
  )
  villagesCache.set(talukaCode, data.data)
  return data.data
}

export const clearLocationCaches = (): void => {
  districtsCache = null
  talukasCache.clear()
  villagesCache.clear()
}
