import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { OtpInput } from '@/components/auth/OtpInput'
import { ResendOtp } from '@/components/auth/ResendOtp'
import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'
import { IS_DEV } from '@/config/env'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { useSendOtp, useVerifyOtp } from '@/hooks/useOtp'
import { useTranslation } from '@/i18n/LanguageProvider'
import { resolveAuthRedirect } from '@/lib/application-entry'
import { getErrorMessage } from '@/lib/api-error'
import { COUNTRY_CODE, OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from '@/lib/validation'

type LocationState = { mobile?: string; devOtp?: string; from?: string }

export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { login } = useAuth()

  const state = (location.state ?? {}) as LocationState
  const mobile = state.mobile ?? ''
  const from = resolveAuthRedirect(state.from)

  const [code, setCode] = useState('')
  const [devOtp, setDevOtp] = useState(state.devOtp ?? '')
  const [finalizing, setFinalizing] = useState(false)

  const verifyOtp = useVerifyOtp()
  const resendOtp = useSendOtp()
  const { seconds, restart } = useCountdown(RESEND_COOLDOWN_SECONDS)

  // No mobile in navigation state means the user landed here directly.
  useEffect(() => {
    if (!mobile) {
      navigate('/login', { replace: true, state: { from } })
    }
  }, [mobile, navigate, from])

  const handleVerify = (value: string): void => {
    if (value.length !== OTP_LENGTH || verifyOtp.isPending || finalizing) return

    verifyOtp.mutate(
      { mobile, otp: value },
      {
        onSuccess: async (result) => {
          setFinalizing(true)
          try {
            await login(result.token)
            navigate(from, { replace: true })
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
    if (resendOtp.isPending || seconds > 0) return
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
    ? getErrorMessage(verifyOtp.error, t('auth.otp.verifyError'))
    : null
  const resendError = resendOtp.isError
    ? getErrorMessage(resendOtp.error, t('auth.otp.resendError'))
    : null

  return (
    <>
      <Seo
        title={t('seo.verifyOtp.title')}
        description={t('seo.verifyOtp.description')}
        path="/verify-otp"
        noindex
      />
      <AuthLayout
        title={t('auth.otp.title')}
        subtitle={
          <>
            {t('auth.otp.subtitle')}
            <br />
            <span className="font-semibold text-forest-900">
              {COUNTRY_CODE} {mobile}
            </span>
          </>
        }
        footer={
          <Link
            to="/login"
            state={{ from }}
            className="text-xs font-medium text-white/80 hover:text-white lg:text-muted-foreground lg:hover:text-forest-900"
          >
            {t('auth.otp.changeMobile')}
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
              {t('auth.otp.devOtp')}{' '}
              <span className="font-bold tracking-widest">{devOtp}</span>
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
            {busy ? t('auth.otp.verifying') : t('auth.otp.verify')}
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
    </>
  )
}
