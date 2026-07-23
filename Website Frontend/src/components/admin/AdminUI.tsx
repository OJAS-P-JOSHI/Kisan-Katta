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
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-steel">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-steel">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function AdminCard({
  children,
  className,
  title,
  action,
  padded = true,
}: {
  children: ReactNode
  className?: string
  title?: string
  action?: ReactNode
  padded?: boolean
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-mist bg-white shadow-soft',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-mist px-4 py-3.5 sm:px-5 sm:py-4">
          {title ? (
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className={cn(padded && 'p-4 sm:p-5')}>{children}</div>
    </section>
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
        'rounded-2xl border bg-white p-4 shadow-soft sm:p-5',
        tones[tone],
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-steel sm:text-xs">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-ink sm:text-2xl">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-steel">{hint}</p> : null}
    </article>
  )
}

export function ProfileSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <AdminCard title={title} className={className}>
      {children}
    </AdminCard>
  )
}

export function InfoGrid({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value?: ReactNode }>
  columns?: 1 | 2 | 3
}) {
  return (
    <dl
      className={cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-steel">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm text-ink">
            {item.value ?? '—'}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-mist/70 sm:h-11" />
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
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center sm:py-16">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-steel">{description}</p>
      ) : null}
    </div>
  )
}

export function AccountStatusBadge({
  status,
}: {
  status: 'ACTIVE' | 'INACTIVE' | string
}) {
  const active = status === 'ACTIVE'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        active
          ? 'border-forest-100 bg-forest-50 text-forest-800'
          : 'border-mist bg-mist/50 text-steel',
      )}
    >
      {status}
    </span>
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

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}
