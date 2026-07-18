import { Check, Clock, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ApplicationDTO } from '@/types/application.types'

type NodeState = 'done' | 'current' | 'upcoming' | 'rejected'

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
  const reached = (statuses: ApplicationDTO['status'][]) => statuses.includes(s)

  const submittedReached = reached([
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'SUSPENDED',
  ])
  const reviewReached = reached([
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'SUSPENDED',
  ])
  const decided = reached(['APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'])
  const isRejected = s === 'REJECTED'

  const nodes: TimelineNode[] = [
    { label: 'Application Started', date: formatDate(app.createdAt), state: 'done' },
    {
      label: 'Submitted',
      date: formatDate(app.submittedAt),
      state: submittedReached ? 'done' : s === 'DRAFT' ? 'current' : 'upcoming',
    },
    {
      label: 'Under Review',
      date: null,
      state: reviewReached ? 'done' : submittedReached ? 'current' : 'upcoming',
    },
    isRejected
      ? { label: 'Rejected', date: formatDate(app.rejectedAt), state: 'rejected' }
      : {
          label: 'Approved',
          date: formatDate(app.approvedAt),
          state: decided ? 'done' : reviewReached ? 'current' : 'upcoming',
        },
  ]

  if (!isRejected) {
    nodes.push({
      label: s === 'SUSPENDED' ? 'Suspended' : 'Active',
      date: null,
      state: s === 'ACTIVE' ? 'done' : s === 'SUSPENDED' ? 'rejected' : 'upcoming',
    })
  }

  return nodes
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
                node.state === 'rejected' && 'border-red-400 bg-red-500 text-white',
                node.state === 'upcoming' && 'border-mist bg-white text-steel',
              )}
            >
              {node.state === 'done' ? (
                <Check className="h-4 w-4" />
              ) : node.state === 'rejected' ? (
                <X className="h-4 w-4" />
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
