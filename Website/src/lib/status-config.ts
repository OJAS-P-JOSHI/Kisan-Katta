import type { ApplicationStatus, PaymentStatus } from '@/types/application.types'

type BadgeStyle = {
  label: string
  /** Tailwind classes for the badge (bg + text + border). */
  className: string
  /** Solid dot / accent color class. */
  dot: string
}

/** Application status → label + colors (per Phase 4B spec). */
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, BadgeStyle> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-forest-50 text-forest-700 border-forest-100',
    dot: 'bg-forest-500',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-forest-50 text-forest-700 border-forest-100',
    dot: 'bg-forest-500',
  },
  SUSPENDED: {
    label: 'Suspended',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
}

/** Payment status → label + colors. */
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, BadgeStyle> = {
  NOT_REQUIRED: {
    label: 'Not Required',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-forest-50 text-forest-700 border-forest-100',
    dot: 'bg-forest-500',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  REFUNDED: {
    label: 'Refunded',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
}
