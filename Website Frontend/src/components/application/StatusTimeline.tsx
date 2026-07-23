import { Check, Clock } from 'lucide-react'

import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { cn } from '@/lib/utils'
import type { ApplicationDTO } from '@/types/application.types'

type NodeState = 'done' | 'current' | 'upcoming'

type TimelineNode = {
  labelKey: TranslationKeys
  date: string | null
  state: NodeState
}

const formatDate = (iso: string | null, locale: string): string | null => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(locale === 'mr' ? 'mr-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const buildNodes = (app: ApplicationDTO, locale: string): TimelineNode[] => {
  const s = app.status

  return [
    {
      labelKey: 'app.timeline.started',
      date: formatDate(app.createdAt, locale),
      state: 'done',
    },
    {
      labelKey: 'app.timeline.readyPayment',
      date: null,
      state:
        s === 'PAYMENT_PENDING'
          ? 'current'
          : s === 'SUBMITTED'
            ? 'done'
            : 'upcoming',
    },
    {
      labelKey: 'app.timeline.submitted',
      date: formatDate(app.submittedAt, locale),
      state: s === 'SUBMITTED' ? 'done' : 'upcoming',
    },
  ]
}

export function StatusTimeline({ application }: { application: ApplicationDTO }) {
  const { t, locale } = useTranslation()
  const nodes = buildNodes(application, locale)

  return (
    <ol className="relative space-y-6 pl-2">
      {nodes.map((node, index) => {
        const isLast = index === nodes.length - 1
        return (
          <li key={node.labelKey} className="relative flex gap-4">
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
                {t(node.labelKey)}
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
