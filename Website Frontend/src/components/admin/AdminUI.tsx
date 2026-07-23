import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-steel">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'green' | 'amber' | 'blue'
}) {
  const tones = {
    default: 'border-mist',
    green: 'border-forest-100 bg-forest-50/40',
    amber: 'border-amber-100 bg-amber-50/50',
    blue: 'border-sky-100 bg-sky-50/50',
  }

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-soft',
        tones[tone],
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-steel">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-steel">{hint}</p> : null}
    </article>
  )
}

export function AdminCard({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-mist bg-white shadow-soft',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-mist px-5 py-4">
          {title ? (
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-xl bg-mist/70"
        />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-steel">{description}</p>
      ) : null}
    </div>
  )
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
