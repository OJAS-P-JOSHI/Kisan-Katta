import type { ReactNode } from 'react'

import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { contactInfo } from '@/data/site'

const POLICY_VERSION = '1.0'
const LAST_UPDATED = '19 July 2026'
const COMPANY_NAME = 'Kisan Katta Agritech Platform'

function LegalLayout({
  title,
  subtitle,
  seoDescription,
  children,
}: {
  title: string
  subtitle: string
  seoDescription: string
  children: ReactNode
}) {
  return (
    <PageLayout>
      <Seo title={title} description={seoDescription} />
      <PageHero title={title} subtitle={subtitle} />
      <section className="section-padding bg-cream">
        <div className="container-wide mx-auto max-w-3xl">
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
              Version {POLICY_VERSION}
            </span>
            <span>Last Updated: {LAST_UPDATED}</span>
          </div>
          <div className="space-y-10">{children}</div>
        </div>
      </section>
    </PageLayout>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-slate">{children}</div>
    </section>
  )
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate marker:text-forest-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Kisan Katta collects, uses, stores, and protects your information."
      seoDescription="Read the Kisan Katta Privacy Policy: what data we collect, how we use it, how it is stored and secured, and your rights."
    >
      <Section title="1. Introduction">
        <p>
          {COMPANY_NAME} (&ldquo;Kisan Katta&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or
          &ldquo;our&rdquo;) is a digital agritech platform serving farmers across Maharashtra. This
          Privacy Policy explains what personal information we collect through our website, mobile
          application, and related services (collectively, the &ldquo;Platform&rdquo;), how we use
          it, and the choices you have. By using the Platform, you agree to the practices described
          in this policy.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>Depending on how you use the Platform, we may collect the following information:</p>
        <List
          items={[
            'Name',
            'Phone number',
            'Email address',
            'Postal / residential address',
            'Aadhaar details (for identity verification)',
            'PAN details (for identity and financial verification)',
            'Bank account details (for payouts and verification)',
            'Documents you upload (identity proofs, land or address proofs, and similar files)',
            'Device information (device model, operating system, app version, and identifiers)',
            'Payment information (processed securely through our payment partner)',
            'Usage analytics (how you interact with the Platform)',
          ]}
        />
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information we collect for the following purposes:</p>
        <List
          items={[
            'Registration and account creation',
            'Identity verification',
            'Gram Sahakari onboarding and application review',
            'Providing customer support',
            'Fraud detection and prevention',
            'Meeting legal and regulatory compliance obligations',
          ]}
        />
      </Section>

      <Section title="4. Data Storage and Processing">
        <p>
          Your data is stored in secured databases hosted on MongoDB. Documents and images that you
          upload are stored and delivered through Cloudinary, our media storage and processing
          provider. We apply access controls and encryption in transit (HTTPS/TLS) to protect data
          as it moves between your device and our servers, and we restrict access to personal
          information to authorized personnel and processes only.
        </p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>
          We rely on trusted third-party service providers to operate the Platform. These include:
        </p>
        <List
          items={[
            'Cloudinary — secure storage and delivery of uploaded documents and images',
            'MongoDB — storage of application and account data',
            'Razorpay — processing of payments and, where enabled, subscriptions',
            'OTP / SMS providers — one-time-password (OTP) based authentication',
          ]}
        />
        <p>
          These providers process your information only as needed to perform their services and are
          expected to maintain appropriate safeguards. Government market price information, weather
          data, and similar external information may be sourced from third-party or government
          providers, whose availability and accuracy may vary.
        </p>
      </Section>

      <Section title="6. Payment Information">
        <p>
          Payments on the Platform are handled by Razorpay. Sensitive payment details such as card
          or banking credentials are processed directly by the payment provider under their security
          standards. We do not store full card details on our own servers.
        </p>
      </Section>

      <Section title="7. Authentication">
        <p>
          We use OTP-based (one-time-password) authentication to verify your phone number and secure
          access to your account. You are responsible for keeping your device and OTPs confidential.
        </p>
      </Section>

      <Section title="8. Cookies and Similar Technologies">
        <p>
          The Platform may use cookies and similar technologies (such as local storage) to remember
          your preferences (for example, your selected language), keep you signed in, and understand
          how the Platform is used so we can improve it. You can control or disable cookies through
          your browser settings, although some features may not function correctly without them.
        </p>
      </Section>

      <Section title="9. Data Retention">
        <p>
          We retain personal information for as long as your account is active or as needed to
          provide our services, comply with our legal obligations, resolve disputes, prevent fraud,
          and enforce our agreements. When information is no longer required, we take reasonable
          steps to delete or anonymize it.
        </p>
      </Section>

      <Section title="10. Security Measures">
        <p>
          We implement reasonable technical and organizational measures to protect your information,
          including encryption in transit, restricted access controls, secure third-party
          processors, and monitoring for unauthorized activity. However, no method of transmission or
          storage is completely secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="11. Your Rights">
        <p>
          You may request correction of inaccurate or incomplete personal information that we hold
          about you. You may also contact our support team with questions about how your data is
          handled or to make a privacy-related request. We will respond to reasonable requests in
          accordance with applicable law.
        </p>
      </Section>

      <Section title="12. Contact Us">
        <p>If you have any questions about this Privacy Policy, you can reach us at:</p>
        <List
          items={[
            <>Email: <a className="text-forest-700 underline" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></>,
            <>Phone: <a className="text-forest-700 underline" href={`tel:${contactInfo.phoneHref}`}>{contactInfo.phone}</a></>,
            <>Address: {contactInfo.address}</>,
          ]}
        />
      </Section>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      subtitle="The terms that govern your use of the Kisan Katta platform."
      seoDescription="Read the Kisan Katta Terms & Conditions covering platform use, Gram Sahakari applications, payments, user responsibilities, liability, and governing law."
    >
      <Section title="1. About the Platform">
        <p>
          {COMPANY_NAME} (&ldquo;Kisan Katta&rdquo;) is a digital agritech platform that provides
          farmers in Maharashtra with tools such as weather information, government market (mandi)
          prices, community insights, a local marketplace, and the Gram Sahakari program. By
          accessing or using the Platform, you agree to be bound by these Terms &amp; Conditions.
        </p>
      </Section>

      <Section title="2. Gram Sahakari Applications">
        <p>
          Applications to become a Gram Sahakari are subject to review. Submitting an application
          does <strong>not</strong> guarantee approval. Approval is granted solely at the discretion
          of Kisan Katta, based on our verification and eligibility criteria.
        </p>
      </Section>

      <Section title="3. Accuracy of Information">
        <p>
          Users must provide accurate, current, and complete information when registering or applying.
          Uploading forged, tampered, or misleading documents may result in rejection of your
          application and suspension or termination of your account.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activity that occurs under your account.
        </p>
      </Section>

      <Section title="4. Payments">
        <h3 className="mt-4 text-base font-semibold text-ink">Gram Sahakari Registration Fee — ₹500</h3>
        <p>
          A registration fee of ₹500 is charged for processing and verification of a Gram Sahakari
          application. This fee covers document verification and administrative processing.
        </p>
        <p>
          Payment of this fee does <strong>not</strong> guarantee approval. The fee is generally
          non-refundable once the verification process has started, except where required by
          applicable law or where Kisan Katta cancels the application before processing has begun.
        </p>

        <h3 className="mt-6 text-base font-semibold text-ink">Subscriptions &amp; Premium Features</h3>
        <p>
          Future premium features may be offered through subscription plans. Subscriptions are not
          active today. Pricing and renewal information will always be shown before purchase.
        </p>
        <p>When and if subscription plans are introduced, the following terms will apply:</p>
        <List
          items={[
            'Any recurring billing will be clearly disclosed before you subscribe.',
            'Users may cancel future renewals at any time through supported methods once subscription management is available.',
            'Cancellation stops future billing but does not automatically refund the current billing period.',
            'Pricing and renewal information will always be presented before purchase.',
          ]}
        />
      </Section>

      <Section title="5. User Responsibilities">
        <p>By using the Platform, you agree not to:</p>
        <List
          items={[
            'Submit false, forged, or misleading documents',
            'Attempt fraud of any kind',
            'Abuse, misuse, or exploit the Platform',
            'Interfere with or disrupt the Platform or its services',
            'Reverse engineer, decompile, or attempt to extract the source code of the application',
          ]}
        />
      </Section>

      <Section title="6. Limitation of Liability">
        <p>
          The Platform and its content are provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis, without warranties of any kind, whether express or implied. To the
          maximum extent permitted by applicable law, Kisan Katta shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages, or for any loss of
          profits, data, or goodwill, arising out of or in connection with your use of, or inability
          to use, the Platform.
        </p>
        <p>
          Information such as weather data and government market prices is sourced from third-party
          or government providers where applicable, and its availability and accuracy may vary. We do
          not guarantee that such information is error-free, and you rely on it at your own
          discretion. To the extent liability cannot be excluded, our total liability is limited to
          the amount you paid to us, if any, for the relevant service.
        </p>
      </Section>

      <Section title="7. Governing Law and Jurisdiction">
        <p>
          These Terms &amp; Conditions are governed by and construed in accordance with the laws of
          India. Any disputes arising out of or relating to these terms or the Platform shall be
          subject to the exclusive jurisdiction of the courts located in Chhatrapati Sambhajinagar,
          Maharashtra.
        </p>
      </Section>

      <Section title="8. Changes to These Terms">
        <p>
          We may update these Terms &amp; Conditions from time to time. Continued use of the Platform
          after changes take effect constitutes acceptance of the revised terms.
        </p>
      </Section>

      <Section title="9. Contact Us">
        <p>For questions about these terms, contact us at:</p>
        <List
          items={[
            <>Email: <a className="text-forest-700 underline" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></>,
            <>Phone: <a className="text-forest-700 underline" href={`tel:${contactInfo.phoneHref}`}>{contactInfo.phone}</a></>,
          ]}
        />
      </Section>
    </LegalLayout>
  )
}

export function RefundPage() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="How refunds and cancellations work on the Kisan Katta platform."
      seoDescription="Kisan Katta Refund & Cancellation Policy for the Gram Sahakari registration fee and future Farmer subscription."
    >
      <Section title="1. Overview">
        <p>
          This Refund &amp; Cancellation Policy explains the terms that apply to fees paid on the
          Kisan Katta platform. Please read it carefully before making any payment.
        </p>
      </Section>

      <Section title="2. Gram Sahakari Registration Fee — ₹500">
        <p>
          The ₹500 registration fee is charged for document verification and administrative
          processing.
        </p>
        <p>
          Once verification has commenced, the fee is generally <strong>non-refundable</strong>{' '}
          except where required by applicable law or where Kisan Katta cancels the application before
          processing.
        </p>
        <p>
          Payment of the registration fee does not guarantee approval of your application. Approval
          remains solely at the discretion of {COMPANY_NAME}.
        </p>
      </Section>

      <Section title="3. Subscriptions &amp; Premium Features">
        <p>
          Future premium features may be offered through subscription plans. Subscriptions are not
          active today. Pricing and renewal information will always be shown before purchase.
        </p>
        <p>When and if subscription plans are launched, the following terms will apply:</p>
        <List
          items={[
            'Users may cancel future renewals at any time through supported methods once subscription management is available.',
            'Cancellation stops future billing but does not automatically refund the current billing period.',
            'No partial refund will be provided for the current billing period unless required by applicable law.',
          ]}
        />
      </Section>

      <Section title="4. How to Request a Refund or Raise a Concern">
        <p>
          If you believe you are eligible for a refund or have a concern about a payment, please
          contact our support team with your registered details and payment reference:
        </p>
        <List
          items={[
            <>Email: <a className="text-forest-700 underline" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a></>,
            <>Phone: <a className="text-forest-700 underline" href={`tel:${contactInfo.phoneHref}`}>{contactInfo.phone}</a></>,
          ]}
        />
      </Section>
    </LegalLayout>
  )
}
