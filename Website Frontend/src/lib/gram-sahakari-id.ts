import type { ApplicationDTO, ApplicationStatus, PaymentStatus } from '@/types/application.types'

/** Card schema version — bump when layout/fields change for verification clients. */
export const ID_CARD_VERSION = '1.0' as const

export const VERIFY_BASE_URL = 'https://kisankatta.in/verify' as const

export type IDCardPayload = {
  volunteerId: string
  applicationNumber: string
  applicationId: string
  fullName: string
  district: string
  taluka: string
  village: string
  phone: string | null
  phoneDisplay: string
  photoUrl: string | null
  issuedAt: string
  issuedAtDisplay: string
  status: 'ACTIVE'
  verificationUrl: string
  version: typeof ID_CARD_VERSION
}

/**
 * Eligibility gate — ID card is only for fully registered volunteers.
 * DRAFT / PAYMENT_PENDING / FAILED / etc. must never render the card.
 */
export function isIDCardEligible(
  app: Pick<ApplicationDTO, 'status' | 'paymentStatus'> | null | undefined,
): boolean {
  if (!app) return false
  return app.status === 'SUBMITTED' && app.paymentStatus === 'PAID'
}

export function isIDCardEligibleFromParts(
  status: ApplicationStatus | null | undefined,
  paymentStatus: PaymentStatus | null | undefined,
): boolean {
  return status === 'SUBMITTED' && paymentStatus === 'PAID'
}

/**
 * Deterministic Volunteer ID from backend applicationNumber.
 *
 * Backend format: `GS-<YEAR>-<SEQUENCE>` e.g. GS-2026-000103
 * Display format: `GS-MH-<YEAR>-<SEQUENCE>` e.g. GS-MH-2026-000103
 *
 * Idempotent — already-prefixed IDs are returned unchanged (uppercased).
 */
export function toVolunteerId(applicationNumber: string): string {
  const raw = applicationNumber.trim().toUpperCase()
  if (!raw) return 'GS-MH-0000-000000'

  if (/^GS-MH-\d{4}-\d+$/.test(raw)) return raw

  const match = raw.match(/^GS-(\d{4})-(\d+)$/)
  if (match) return `GS-MH-${match[1]}-${match[2]}`

  // Fallback: embed the application number after the MH region code.
  const cleaned = raw.replace(/^GS-?/i, '').replace(/[^A-Z0-9-]/g, '')
  return `GS-MH-${cleaned || '0000-000000'}`
}

export function buildVerificationUrl(volunteerId: string): string {
  return `${VERIFY_BASE_URL}/${encodeURIComponent(volunteerId)}`
}

/** Mask mobile for display: +91******3210 or ******3210 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '—'
  const last4 = digits.slice(-4)
  if (digits.length >= 12 && digits.startsWith('91')) {
    return `+91******${last4}`
  }
  if (digits.length === 10) {
    return `******${last4}`
  }
  return `******${last4}`
}

export function formatIssueDate(iso: string | null | undefined, locale: 'en' | 'mr' = 'en'): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale === 'mr' ? 'mr-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Build the structured payload used by the card UI and QR payload.
 * Future backend verification can validate the same volunteerId + applicationNumber.
 */
export function buildIDCardPayload(
  app: ApplicationDTO,
  locale: 'en' | 'mr' = 'en',
): IDCardPayload | null {
  if (!isIDCardEligible(app)) return null

  const volunteerId = toVolunteerId(app.applicationNumber)
  const issuedAt = app.submittedAt ?? app.updatedAt

  return {
    volunteerId,
    applicationNumber: app.applicationNumber,
    applicationId: app.id,
    fullName: (app.fullName ?? '').trim() || 'Gram Sahakari',
    district: (app.district ?? '').trim() || '—',
    taluka: (app.taluka ?? '').trim() || '—',
    village: (app.village ?? '').trim() || '—',
    phone: app.phone,
    phoneDisplay: maskPhone(app.phone),
    photoUrl: app.photo?.url ?? null,
    issuedAt,
    issuedAtDisplay: formatIssueDate(issuedAt, locale),
    status: 'ACTIVE',
    verificationUrl: buildVerificationUrl(volunteerId),
    version: ID_CARD_VERSION,
  }
}

/**
 * Compact QR payload — URL-first so scanners open verification.
 * Query params carry machine-readable fields for a future verify API.
 */
export function buildQRContent(payload: IDCardPayload): string {
  const url = new URL(payload.verificationUrl)
  url.searchParams.set('app', payload.applicationNumber)
  url.searchParams.set('v', payload.version)
  return url.toString()
}
