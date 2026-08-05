/**
 * Location Master DTOs — mirror backend `/api/v1/location` responses.
 * Same contracts as Mobile App `features/location/location.types.ts`.
 */

export type LocationDistrict = {
  code: number
  name: string
  nameMr?: string | null
}

export type LocationTaluka = {
  code: number
  name: string
  nameMr?: string | null
}

export type LocationVillage = {
  code: number
  name: string
  nameMr: string
  category: string
  status: string
}
