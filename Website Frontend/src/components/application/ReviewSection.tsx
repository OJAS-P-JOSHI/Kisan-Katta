import { Pencil } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type ReviewItem = {
  label: string
  value: ReactNode
  /** Highlights the row in red when a required value is missing. */
  missing?: boolean
}

interface ReviewSectionProps {
  title: string
  items: ReviewItem[]
  /** Omit to hide Edit (locked application). */
  onEdit?: () => void
}

/** Summary block for the Review step with a per-section "Edit" jump. */
export function ReviewSection({ title, items, onEdit }: ReviewSectionProps) {
  return (
    <section className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft sm:p-5">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink sm:text-base">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1 text-xs font-semibold text-forest-700 transition-colors hover:text-forest-900"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd
              className={cn(
                'break-words text-sm font-medium',
                item.missing ? 'text-red-500' : 'text-ink',
              )}
            >
              {item.missing ? 'Missing' : (item.value ?? '—')}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
