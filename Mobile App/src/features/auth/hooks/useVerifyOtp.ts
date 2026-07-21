import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { verifyOtp as verifyOtpRequest } from '../services/auth.service';
import type { VerifyOtpResponse } from '../types/auth.types';

export type UseVerifyOtpReturn = {
  loading: boolean;
  error: string | null;
  verifyOtp: (mobile: string, otp: string) => Promise<VerifyOtpResponse | null>;
  clearError: () => void;
};

export function useVerifyOtp(): UseVerifyOtpReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = useCallback(async (mobile: string, otp: string): Promise<VerifyOtpResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await verifyOtpRequest(mobile, otp);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to verify OTP. Please try again.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, verifyOtp, clearError };
}
