import axios from 'axios'

import { api } from '@/api/axios'

export type VerificationSuccess = {
  verified: true
  volunteerId: string
  name: string
  district: string
  taluka: string
  village: string
  status: 'ACTIVE'
  photoUrl: string | null
  issuedAt: string
  verifiedAt: string
}

export type VerificationFailure = {
  verified: false
  message: string
}

export type VerificationResult = VerificationSuccess | VerificationFailure

/**
 * Public verification — no auth required.
 * Response is a flat DTO (not the usual { success, data } envelope).
 */
export const verifyVolunteerById = async (
  volunteerId: string,
): Promise<VerificationResult> => {
  try {
    const { data } = await api.get<VerificationResult>(
      `/api/v1/verify/${encodeURIComponent(volunteerId)}`,
    )
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const body = error.response.data as Partial<VerificationFailure>
      if (typeof body.verified === 'boolean' && body.verified === false) {
        return {
          verified: false,
          message: body.message ?? 'Volunteer not found.',
        }
      }
      if (error.response.status === 404) {
        return { verified: false, message: 'Volunteer not found.' }
      }
      if (error.response.status === 400) {
        return {
          verified: false,
          message:
            (error.response.data as { message?: string }).message ??
            'Invalid Volunteer ID.',
        }
      }
    }
    throw error
  }
}
