import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FullScreenLoader } from '@/components/FullScreenLoader'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useTranslation } from '@/i18n/LanguageProvider'

const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
)
const AboutPage = lazy(() =>
  import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })),
)
const BecomeGramSahakariPage = lazy(() =>
  import('@/pages/BecomeGramSahakariPage').then((m) => ({
    default: m.BecomeGramSahakariPage,
  })),
)
const ContactPage = lazy(() =>
  import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })),
)
const FAQPage = lazy(() =>
  import('@/pages/FAQPage').then((m) => ({ default: m.FAQPage })),
)
const FeaturesPage = lazy(() =>
  import('@/pages/FeaturesPage').then((m) => ({ default: m.FeaturesPage })),
)
const PrivacyPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.TermsPage })),
)
const RefundPage = lazy(() =>
  import('@/pages/LegalPages').then((m) => ({ default: m.RefundPage })),
)
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const ApplicationPage = lazy(() =>
  import('@/pages/ApplicationPage').then((m) => ({ default: m.ApplicationPage })),
)
const ApplicationStatusPage = lazy(() =>
  import('@/pages/ApplicationStatusPage').then((m) => ({
    default: m.ApplicationStatusPage,
  })),
)
const ApplicationSuccessPage = lazy(() =>
  import('@/pages/ApplicationSuccessPage').then((m) => ({
    default: m.ApplicationSuccessPage,
  })),
)
const ProfilePage = lazy(() =>
  import('@/pages/ProtectedPages').then((m) => ({ default: m.ProfilePage })),
)
const VerifyOtpPage = lazy(() =>
  import('@/pages/VerifyOtpPage').then((m) => ({ default: m.VerifyOtpPage })),
)
const VerifyVolunteerPage = lazy(() =>
  import('@/pages/VerifyVolunteerPage').then((m) => ({ default: m.VerifyVolunteerPage })),
)

function RouteFallback() {
  const { t } = useTranslation()
  return <FullScreenLoader message={t('common.loading')} />
}

export function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/become-gram-sahakari" element={<BecomeGramSahakariPage />} />
          <Route path="/become-kisan-mitra" element={<Navigate to="/become-gram-sahakari" replace />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/verify/:volunteerId" element={<VerifyVolunteerPage />} />

          {/* Legal */}
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/refund-policy" element={<RefundPage />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />

          {/* Protected */}
          <Route
            path="/application"
            element={
              <ProtectedRoute>
                <ApplicationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/application/status"
            element={
              <ProtectedRoute>
                <ApplicationStatusPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/application/success"
            element={
              <ProtectedRoute>
                <ApplicationSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
