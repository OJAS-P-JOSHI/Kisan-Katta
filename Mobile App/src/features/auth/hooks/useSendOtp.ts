import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/utils';

import { sendOtp as sendOtpRequest } from '../services/auth.service';
import type { SendOtpResponse } from '../types/auth.types';

export type UseSendOtpReturn = {
  loading: boolean;
  error: string | null;
  sendOtp: (mobile: string) => Promise<SendOtpResponse | null>;
  clearError: () => void;
};

export function useSendOtp(): UseSendOtpReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (mobile: string): Promise<SendOtpResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      return await sendOtpRequest(mobile);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send OTP. Please try again.'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, sendOtp, clearError };
}
