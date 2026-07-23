import { RotateCcw } from 'lucide-react'

import { useTranslation } from '@/i18n/LanguageProvider'

interface ResendOtpProps {
  /** Remaining cooldown seconds; when 0 the resend action is enabled. */
  seconds: number
  /** Whether a resend request is currently in flight. */
  loading: boolean
  onResend: () => void
}

/** Countdown-gated "Resend OTP" control, mirroring the mobile app. */
export function ResendOtp({ seconds, loading, onResend }: ResendOtpProps) {
  const { t } = useTranslation()

  if (seconds > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t('auth.otp.resendIn', { seconds })}
      </p>
    )
  }

  return (
    <button
      type="button"
      onClick={onResend}
      disabled={loading}
      className="touch-target mx-auto flex items-center justify-center gap-2 text-sm font-semibold text-forest-700 transition-colors hover:text-forest-900 disabled:opacity-60"
    >
      <RotateCcw className="h-4 w-4" />
      {loading ? t('auth.otp.sending') : t('auth.otp.resend')}
    </button>
  )
}
