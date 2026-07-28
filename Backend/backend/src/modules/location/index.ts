export { default as locationRoutes } from "./location.routes";
export type {
  DistrictListItemDTO,
  TalukaListItemDTO,
  VillageListItemDTO,
  LocationDistrict,
  LocationTaluka,
  LocationVillage,
  LocationMaster,
  ResolvedLocation,
  ResolveLocationInput,
} from "./location.types";
export {
  listDistricts,
  listTalukasByDistrictCode,
  listVillagesByTalukaCode,
  getLocationMasterStats,
  getDistrictByCode,
  getTalukaByCode,
  getVillageByCode,
  resolveLocationHierarchy,
} from "./location.service";
