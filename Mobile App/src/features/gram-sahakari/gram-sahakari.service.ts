import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type { RepresentativeDiscovery } from './gram-sahakari.types';

const BASE = '/api/v1/gram-sahakari';

/** Discover paid Village Representatives near the farmer's profile location. */
export const getRepresentativeDiscovery = async (): Promise<RepresentativeDiscovery> => {
  const { data } = await api.get<ApiSuccessResponse<RepresentativeDiscovery>>(
    `${BASE}/representative`,
  );
  return data.data;
};
