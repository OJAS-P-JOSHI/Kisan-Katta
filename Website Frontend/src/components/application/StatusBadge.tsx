import {
  APPLICATION_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/lib/status-config'
import { cn } from '@/lib/utils'
import type { ApplicationStatus, PaymentStatus } from '@/types/application.types'

type StatusBadgeProps =
  | { kind: 'application'; status: ApplicationStatus; className?: string }
  | { kind: 'payment'; status: PaymentStatus; className?: string }

/** Colored pill for application / payment status. */
export function StatusBadge(props: StatusBadgeProps) {
  const config =
    props.kind === 'application'
      ? APPLICATION_STATUS_CONFIG[props.status]
      : PAYMENT_STATUS_CONFIG[props.status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        config.className,
        props.className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
