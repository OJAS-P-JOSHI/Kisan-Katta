import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginCard } from '@/components/auth/LoginCard'
import { Seo } from '@/components/common/Seo'
import { useAuth } from '@/hooks/useAuth'
import { useSendOtp } from '@/hooks/useOtp'
import { useTranslation } from '@/i18n/LanguageProvider'
import { resolveAuthRedirect } from '@/lib/application-entry'
import { getErrorMessage } from '@/lib/api-error'

type LoginLocationState = { from?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const { isAuthenticated, loading } = useAuth()
  const sendOtp = useSendOtp()

  const from = resolveAuthRedirect((location.state as LoginLocationState | null)?.from)

  // Authenticated users never need the login screen — resume their flow.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [loading, isAuthenticated, navigate, from])

  const handleSubmit = (mobile: string): void => {
    if (sendOtp.isPending) return
    sendOtp.mutate(mobile, {
      onSuccess: (result) => {
        navigate('/verify-otp', {
          state: { mobile, devOtp: result.otp ?? '', from },
        })
      },
    })
  }

  return (
    <>
      <Seo
        title={t('seo.login.title')}
        description={t('seo.login.description')}
        path="/login"
        noindex
      />
      <AuthLayout
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
        footer={
          <p className="text-xs text-white/70 lg:text-muted-foreground">
            {t('auth.login.agreePrefix')}{' '}
            <Link to="/terms-and-conditions" className="font-medium underline-offset-2 hover:underline">
              {t('auth.login.terms')}
            </Link>{' '}
            &{' '}
            <Link to="/privacy-policy" className="font-medium underline-offset-2 hover:underline">
              {t('auth.login.privacy')}
            </Link>
          </p>
        }
      >
        <LoginCard
          onSubmit={handleSubmit}
          loading={sendOtp.isPending}
          serverError={
            sendOtp.isError
              ? getErrorMessage(sendOtp.error, t('auth.login.sendError'))
              : null
          }
        />
      </AuthLayout>
    </>
  )
}
