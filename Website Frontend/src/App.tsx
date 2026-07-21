import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AboutPage } from '@/pages/AboutPage'
import { BecomeGramSahakariPage } from '@/pages/BecomeGramSahakariPage'
import { ContactPage } from '@/pages/ContactPage'
import { FAQPage } from '@/pages/FAQPage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { LandingPage } from '@/pages/LandingPage'
import { PrivacyPage, RefundPage, TermsPage } from '@/pages/LegalPages'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/LoginPage'
import { ApplicationPage } from '@/pages/ApplicationPage'
import { ApplicationStatusPage } from '@/pages/ApplicationStatusPage'
import { ApplicationSuccessPage } from '@/pages/ApplicationSuccessPage'
import { ProfilePage } from '@/pages/ProtectedPages'
import { VerifyOtpPage } from '@/pages/VerifyOtpPage'

export function App() {
  return (
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

      {/* Legal */}
      <Route path="/privacy-policy" element={<PrivacyPage />} />
      <Route path="/terms-and-conditions" element={<TermsPage />} />
      <Route path="/refund-policy" element={<RefundPage />} />
      {/* Backwards-compatible redirects for previous legal paths */}
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
  )
}
