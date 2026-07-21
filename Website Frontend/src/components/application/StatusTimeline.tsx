import { Check, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ApplicationDTO } from '@/types/application.types'

type NodeState = 'done' | 'current' | 'upcoming'

type TimelineNode = {
  label: string
  date: string | null
  state: NodeState
}

const formatDate = (iso: string | null): string | null => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const buildNodes = (app: ApplicationDTO): TimelineNode[] => {
  const s = app.status

  return [
    {
      label: 'Application Started',
      date: formatDate(app.createdAt),
      state: 'done',
    },
    {
      label: 'Ready for Payment',
      date: null,
      state:
        s === 'PAYMENT_PENDING'
          ? 'current'
          : s === 'SUBMITTED'
            ? 'done'
            : s === 'DRAFT'
              ? 'upcoming'
              : 'upcoming',
    },
    {
      label: 'Submitted',
      date: formatDate(app.submittedAt),
      state: s === 'SUBMITTED' ? 'done' : s === 'PAYMENT_PENDING' ? 'upcoming' : 'upcoming',
    },
  ]
}

export function StatusTimeline({ application }: { application: ApplicationDTO }) {
  const nodes = buildNodes(application)

  return (
    <ol className="relative space-y-6 pl-2">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1
        return (
          <li key={node.label} className="relative flex gap-4">
            {!isLast && (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%+0.5rem)] w-0.5',
                  node.state === 'done' ? 'bg-forest-500' : 'bg-mist',
                )}
              />
            )}
            <span
              className={cn(
                'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                node.state === 'done' && 'border-forest-500 bg-forest-500 text-white',
                node.state === 'current' && 'border-orange-400 bg-orange-50 text-orange-500',
                node.state === 'upcoming' && 'border-mist bg-white text-steel',
              )}
            >
              {node.state === 'done' ? (
                <Check className="h-4 w-4" />
              ) : node.state === 'current' ? (
                <Clock className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </span>
            <div className="pt-1">
              <p
                className={cn(
                  'text-sm font-semibold',
                  node.state === 'upcoming' ? 'text-muted-foreground' : 'text-ink',
                )}
              >
                {node.label}
              </p>
              {node.date && (
                <p className="text-xs text-muted-foreground">{node.date}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
