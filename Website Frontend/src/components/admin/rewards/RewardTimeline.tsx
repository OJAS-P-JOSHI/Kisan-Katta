import { formatDateTime } from '@/components/admin/AdminUI'
import type { RewardDetail } from '@/types/reward.types'

const LABEL_MAP: Record<string, string> = {
  Created: 'Reward Created',
  Approved: 'Pending',
  Paid: 'Paid',
  Cancelled: 'Cancelled',
}

const DOT: Record<string, string> = {
  Created: 'bg-forest-500',
  Approved: 'bg-amber-500',
  Paid: 'bg-forest-700',
  Cancelled: 'bg-steel',
}

export function RewardTimeline({
  timeline,
}: {
  timeline: RewardDetail['timeline']
}) {
  const visible = timeline.filter((item) => {
    if (item.label === 'Paid' && !item.at) return false
    if (item.label === 'Cancelled' && !item.at && !item.by) return false
    return true
  })

  return (
    <ol className="relative space-y-5 border-l border-mist pl-4">
      {visible.map((item, index) => (
        <li key={`${item.label}-${item.at ?? index}`}>
          <span
            className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${DOT[item.label] ?? 'bg-mist'}`}
          />
          <p className="text-sm font-medium text-ink">
            {LABEL_MAP[item.label] ?? item.label}
          </p>
          <p className="text-xs text-steel">
            {item.at ? formatDateTime(item.at) : '—'}
            {item.by ? ` · ${item.by}` : ''}
          </p>
          {item.note ? (
            <p className="mt-0.5 text-xs text-steel">{item.note}</p>
          ) : null}
          {index < visible.length - 1 ? (
            <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-steel/70">
              ↓
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
