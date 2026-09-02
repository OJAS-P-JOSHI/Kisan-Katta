import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminRoute } from '@/components/admin/AdminRoute'
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
const ForbiddenPage = lazy(() =>
  import('@/pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })),
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

const AdminFarmersPage = lazy(() =>
  import('@/pages/admin/AdminFarmersPage').then((m) => ({
    default: m.AdminFarmersPage,
  })),
)
const AdminFarmerDetailPage = lazy(() =>
  import('@/pages/admin/AdminFarmerDetailPage').then((m) => ({
    default: m.AdminFarmerDetailPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)
const AdminGramSahakariPage = lazy(() =>
  import('@/pages/admin/AdminGramSahakariPage').then((m) => ({
    default: m.AdminGramSahakariPage,
  })),
)
const AdminApplicationDetailPage = lazy(() =>
  import('@/pages/admin/AdminApplicationDetailPage').then((m) => ({
    default: m.AdminApplicationDetailPage,
  })),
)
const AdminPaymentsPage = lazy(() =>
  import('@/pages/admin/AdminPaymentsPage').then((m) => ({
    default: m.AdminPaymentsPage,
  })),
)
const AdminAnalyticsPage = lazy(() =>
  import('@/pages/admin/AdminAnalyticsPage').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
)
const AdminReportsPage = lazy(() =>
  import('@/pages/admin/AdminReportsPage').then((m) => ({
    default: m.AdminReportsPage,
  })),
)
const AdminSettingsPage = lazy(() =>
  import('@/pages/admin/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  })),
)
const AdminUserVaultPage = lazy(() =>
  import('@/pages/admin/AdminUserVaultPage').then((m) => ({
    default: m.AdminUserVaultPage,
  })),
)
const AdminSubscriptionsPage = lazy(() =>
  import('@/pages/admin/AdminSubscriptionsPage').then((m) => ({
    default: m.AdminSubscriptionsPage,
  })),
)
const AdminMarketplacePage = lazy(() =>
  import('@/pages/admin/AdminMarketplacePage').then((m) => ({
    default: m.AdminMarketplacePage,
  })),
)
const AdminMarketplaceDetailPage = lazy(() =>
  import('@/pages/admin/AdminMarketplacePage').then((m) => ({
    default: m.AdminMarketplaceDetailPage,
  })),
)

function RedirectToGramSahakariDetail() {
  const { id = '' } = useParams()
  return <Navigate to={`/admin/gram-sahakari/${id}`} replace />
}

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
          <Route path="/403" element={<ForbiddenPage />} />

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

          {/* Admin portal */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="farmers" element={<AdminFarmersPage />} />
            <Route path="farmers/:id" element={<AdminFarmerDetailPage />} />
            <Route path="users/:userId" element={<AdminUserVaultPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="gram-sahakari" element={<AdminGramSahakariPage />} />
            <Route path="gram-sahakari/:id" element={<AdminApplicationDetailPage />} />
            <Route
              path="applications"
              element={<Navigate to="/admin/gram-sahakari" replace />}
            />
            <Route
              path="applications/:id"
              element={<RedirectToGramSahakariDetail />}
            />
            <Route
              path="gram-sahakaris"
              element={
                <Navigate
                  to="/admin/gram-sahakari?view=representatives"
                  replace
                />
              }
            />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="marketplace" element={<AdminMarketplacePage />} />
            <Route path="marketplace/:id" element={<AdminMarketplaceDetailPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}
