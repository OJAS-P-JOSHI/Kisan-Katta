import { useQuery } from '@tanstack/react-query'

import { verifyVolunteerById } from '@/api/verification.api'

export const verificationKeys = {
  all: ['verification'] as const,
  byId: (volunteerId: string) =>
    [...verificationKeys.all, volunteerId] as const,
}

export const useVerifyVolunteer = (volunteerId: string) =>
  useQuery({
    queryKey: verificationKeys.byId(volunteerId),
    queryFn: () => verifyVolunteerById(volunteerId),
    enabled: Boolean(volunteerId),
    staleTime: 60_000,
    retry: 1,
  })
