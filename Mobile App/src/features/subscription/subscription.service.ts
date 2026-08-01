import { api } from '@/services/api';
import type { ApiSuccessResponse } from '@/types';

import type {
  CreateSubscriptionResponse,
  SubscriptionDTO,
  SubscriptionStatusDTO,
  VerifySubscriptionBody,
  VerifySubscriptionResponse,
} from './subscription.types';

const BASE = '/api/v1/subscription';

export const createSubscription = async (): Promise<CreateSubscriptionResponse> => {
  const { data } = await api.post<ApiSuccessResponse<CreateSubscriptionResponse>>(
    `${BASE}/create`,
  );
  return data.data;
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatusDTO> => {
  const { data } = await api.get<ApiSuccessResponse<SubscriptionStatusDTO>>(`${BASE}/status`);
  return data.data;
};

export const getCurrentSubscription = async (): Promise<SubscriptionDTO | null> => {
  const { data } = await api.get<ApiSuccessResponse<SubscriptionDTO | null>>(`${BASE}/current`);
  return data.data;
};

export const verifySubscription = async (
  body: VerifySubscriptionBody,
): Promise<VerifySubscriptionResponse> => {
  const { data } = await api.post<ApiSuccessResponse<VerifySubscriptionResponse>>(
    `${BASE}/verify`,
    body,
  );
  return data.data;
};

export const refreshSubscription = async (): Promise<SubscriptionDTO> => {
  const { data } = await api.post<ApiSuccessResponse<SubscriptionDTO>>(`${BASE}/refresh`);
  return data.data;
};

export const cancelSubscription = async (
  cancelAtCycleEnd = true,
): Promise<SubscriptionDTO> => {
  const { data } = await api.post<ApiSuccessResponse<SubscriptionDTO>>(`${BASE}/cancel`, {
    cancelAtCycleEnd,
  });
  return data.data;
};
