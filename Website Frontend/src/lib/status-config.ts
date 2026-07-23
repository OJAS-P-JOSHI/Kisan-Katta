import type { TranslationKeys } from '@/i18n/translations'
import type { ApplicationStatus, PaymentStatus } from '@/types/application.types'

type BadgeStyle = {
  labelKey: TranslationKeys
  /** Tailwind classes for the badge (bg + text + border). */
  className: string
  /** Solid dot / accent color class. */
  dot: string
}

/** Application status → label key + colors. */
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, BadgeStyle> = {
  DRAFT: {
    labelKey: 'app.statusLabel.DRAFT',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
  PAYMENT_PENDING: {
    labelKey: 'app.statusLabel.PAYMENT_PENDING',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  SUBMITTED: {
    labelKey: 'app.statusLabel.SUBMITTED',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
}

/** Payment status → label key + colors. */
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, BadgeStyle> = {
  NOT_REQUIRED: {
    labelKey: 'app.paymentLabel.NOT_REQUIRED',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
  PENDING: {
    labelKey: 'app.paymentLabel.PENDING',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  AUTHORIZED: {
    labelKey: 'app.paymentLabel.AUTHORIZED',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  PAID: {
    labelKey: 'app.paymentLabel.PAID',
    className: 'bg-forest-50 text-forest-700 border-forest-100',
    dot: 'bg-forest-500',
  },
  FAILED: {
    labelKey: 'app.paymentLabel.FAILED',
    className: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  REFUNDED: {
    labelKey: 'app.paymentLabel.REFUNDED',
    className: 'bg-mist/60 text-slate border-mist',
    dot: 'bg-steel',
  },
}
