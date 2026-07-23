import { ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useId, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Mobile: expandable panel / bottom-sheet style filters.
 * Desktop: inline filter grid (always visible).
 */
export function FilterPanel({
  children,
  activeCount = 0,
  className,
}: {
  children: ReactNode
  activeCount?: number
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className={cn('mb-4', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-mist bg-white px-4 py-3 text-sm font-medium text-ink shadow-soft lg:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-forest-700" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-forest-900 px-2 py-0.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-steel transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {/* Mobile sheet */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink/40 transition-opacity duration-200',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={cn(
            'absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift transition-transform duration-250 ease-out',
            open ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Filters</h3>
            <button
              type="button"
              className="rounded-xl p-2 text-steel hover:bg-mist/60"
              onClick={() => setOpen(false)}
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid gap-3">{children}</div>
          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-forest-900 py-3 text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Apply filters
          </button>
        </div>
      </div>

      {/* Desktop inline */}
      <div className="hidden grid-cols-2 gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-6">
        {children}
      </div>
    </div>
  )
}

export const filterControlClass =
  'min-h-11 w-full rounded-xl border border-mist bg-white px-3 py-2.5 text-sm text-ink outline-none ring-forest-500/30 placeholder:text-steel focus:ring-2'
