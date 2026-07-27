import { cn } from '@/lib/utils'
import type { RewardStatus } from '@/types/reward.types'

const STYLES: Record<RewardStatus, string> = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  PAID: 'border-forest-200 bg-forest-50 text-forest-800',
  CANCELLED: 'border-mist bg-mist/50 text-steel',
}

export function RewardStatusBadge({ status }: { status: RewardStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STYLES[status],
      )}
    >
      {status}
    </span>
  )
}
