export {
  fetchDistricts,
  fetchTalukas,
  fetchVillages,
  clearLocationCaches,
} from './location.service'
export { useDistricts } from './hooks/useDistricts'
export { useTalukas } from './hooks/useTalukas'
export { useVillages } from './hooks/useVillages'
export { LocationSelect } from './components/LocationSelect'
export type {
  LocationOption,
  LocationSelectProps,
} from './components/LocationSelect'
export { locationStrings } from './location.strings'
export { locationNamesMatch, normalizeLocationName } from './location.utils'
export type {
  LocationDistrict,
  LocationTaluka,
  LocationVillage,
} from './location.types'
