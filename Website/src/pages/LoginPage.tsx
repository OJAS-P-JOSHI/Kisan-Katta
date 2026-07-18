import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginCard } from '@/components/auth/LoginCard'
import { getErrorMessage } from '@/lib/api-error'
import { useAuth } from '@/hooks/useAuth'
import { useSendOtp } from '@/hooks/useOtp'

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()
  const sendOtp = useSendOtp()

  // Authenticated users never need the login screen.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/application', { replace: true })
    }
  }, [loading, isAuthenticated, navigate])

  const handleSubmit = (mobile: string): void => {
    sendOtp.mutate(mobile, {
      onSuccess: (result) => {
        navigate('/verify-otp', {
          state: { mobile, devOtp: result.otp ?? '' },
        })
      },
    })
  }

  return (
    <AuthLayout
      title="Gram Sahakari Portal"
      subtitle="Enter your mobile number to continue"
      footer={
        <p className="text-xs text-white/70 lg:text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="font-medium underline-offset-2 hover:underline">
            Terms
          </Link>{' '}
          &{' '}
          <Link to="/privacy" className="font-medium underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
        </p>
      }
    >
      <LoginCard
        onSubmit={handleSubmit}
        loading={sendOtp.isPending}
        serverError={
          sendOtp.isError
            ? getErrorMessage(sendOtp.error, 'Unable to send OTP. Please try again.')
            : null
        }
      />
    </AuthLayout>
  )
}
