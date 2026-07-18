import { Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AboutPage } from '@/pages/AboutPage'
import { BecomeGramSahakariPage } from '@/pages/BecomeGramSahakariPage'
import { ContactPage } from '@/pages/ContactPage'
import { FAQPage } from '@/pages/FAQPage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { LandingPage } from '@/pages/LandingPage'
import { PrivacyPage, TermsPage } from '@/pages/LegalPages'
import { LoginPage } from '@/pages/LoginPage'
import { ApplicationPage } from '@/pages/ApplicationPage'
import { ApplicationStatusPage } from '@/pages/ApplicationStatusPage'
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
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />

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
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
