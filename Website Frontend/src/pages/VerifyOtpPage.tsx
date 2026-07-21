import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { ResendOtp } from '@/components/auth/ResendOtp'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { useSendOtp, useVerifyOtp } from '@/hooks/useOtp'
import { getErrorMessage } from '@/lib/api-error'
import { IS_DEV } from '@/config/env'
import { COUNTRY_CODE, OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/lib/validation'

type LocationState = { mobile?: string; devOtp?: string; from?: string }

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const state = (location.state ?? {}) as LocationState
  const mobile = state.mobile ?? ''

  const [code, setCode] = useState('')
  const [devOtp, setDevOtp] = useState(state.devOtp ?? '')
  const [finalizing, setFinalizing] = useState(false)

  const verifyOtp = useVerifyOtp()
  const resendOtp = useSendOtp()
  const { seconds, restart } = useCountdown(RESEND_COOLDOWN_SECONDS)

  // No mobile in navigation state means the user landed here directly.
  useEffect(() => {
    if (!mobile) {
      navigate('/login', { replace: true })
    }
  }, [mobile, navigate])

  const handleVerify = (value: string): void => {
    if (value.length !== OTP_LENGTH || verifyOtp.isPending || finalizing) return

    verifyOtp.mutate(
      { mobile, otp: value },
      {
        onSuccess: async (result) => {
          setFinalizing(true)
          try {
            await login(result.token)
            const redirectTo = state.from ?? '/application'
            navigate(redirectTo, { replace: true })
          } catch {
            setFinalizing(false)
          }
        },
        onError: () => {
          setCode('')
        },
      },
    )
  }

  const handleResend = (): void => {
    resendOtp.mutate(mobile, {
      onSuccess: (result) => {
        setDevOtp(result.otp ?? '')
        setCode('')
        restart()
      },
    })
  }

  const busy = verifyOtp.isPending || finalizing
  const verifyError = verifyOtp.isError
    ? getErrorMessage(verifyOtp.error, 'Unable to verify OTP. Please try again.')
    : null
  const resendError = resendOtp.isError
    ? getErrorMessage(resendOtp.error, 'Unable to resend OTP. Please try again.')
    : null

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={
        <>
          Enter the 6-digit code sent to
          <br />
          <span className="font-semibold text-forest-900">
            {COUNTRY_CODE} {mobile}
          </span>
        </>
      }
      footer={
        <Link
          to="/login"
          className="text-xs font-medium text-white/80 hover:text-white lg:text-muted-foreground lg:hover:text-forest-900"
        >
          Change mobile number
        </Link>
      }
    >
      <div className="space-y-6">
        <OtpInput
          value={code}
          onChange={setCode}
          onComplete={handleVerify}
          disabled={busy}
          invalid={Boolean(verifyError)}
        />

        {IS_DEV && devOtp && (
          <p className="rounded-lg bg-gold-100 px-3 py-2 text-center text-xs text-gold-600">
            Dev OTP: <span className="font-bold tracking-widest">{devOtp}</span>
          </p>
        )}

        {(verifyError || resendError) && (
          <p role="alert" className="text-center text-sm font-medium text-red-600">
            {verifyError ?? resendError}
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={code.length !== OTP_LENGTH || busy}
          onClick={() => handleVerify(code)}
        >
          {busy ? 'Verifying…' : 'Verify & Continue'}
        </Button>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ResendOtp
            seconds={seconds}
            loading={resendOtp.isPending}
            onResend={handleResend}
          />
        </motion.div>
      </div>
    </AuthLayout>
  )
}
