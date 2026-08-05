import { Check, ChevronDown, Loader2, Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { locationStrings } from '../location.strings'
import { cn } from '@/lib/utils'

export type LocationOption = {
  code: number
  name: string
  /** Optional secondary line (e.g. Marathi village name). */
  subtitle?: string
}

export type LocationSelectProps = {
  label: string
  value: LocationOption | null
  options: readonly LocationOption[]
  onSelect: (option: LocationOption) => void
  error?: string
  disabled?: boolean
  loading?: boolean
  loadError?: string | null
  onRetry?: () => void
  /** Enables in-panel search (recommended for villages). */
  searchable?: boolean
  placeholder?: string
  required?: boolean
}

/**
 * Code+name picker used for District / Taluka / Village.
 * Behaviour mirrors Mobile App LocationSelect (searchable modal list).
 */
export function LocationSelect({
  label,
  value,
  options,
  onSelect,
  error,
  disabled,
  loading,
  loadError,
  onRetry,
  searchable = false,
  placeholder,
  required,
}: LocationSelectProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((item) => {
      const nameHit = item.name.toLowerCase().includes(q)
      const subHit = item.subtitle?.toLowerCase().includes(q) ?? false
      return nameHit || subHit
    })
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus()
    }
  }, [open, searchable])

  const openPanel = (): void => {
    if (disabled || loading) return
    setQuery('')
    setOpen(true)
  }

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <label className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={Boolean(error || loadError)}
          onClick={() => (open ? setOpen(false) : openPanel())}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-xl border border-border bg-white px-4 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-mist/40 disabled:text-steel',
            !value && 'text-muted-foreground',
            (error || loadError) && 'border-red-400 focus-visible:ring-red-400',
          )}
        >
          <span className="truncate">{value?.name || placeholder || 'Select…'}</span>
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>

        {open ? (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-mist bg-white shadow-lift"
          >
            {searchable ? (
              <div className="border-b border-mist p-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={locationStrings.searchPlaceholder}
                    className="h-10 w-full rounded-lg border border-mist bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-forest-500/30"
                    aria-label={locationStrings.searchPlaceholder}
                  />
                </div>
              </div>
            ) : null}

            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-steel">
                  {locationStrings.emptySearch}
                </li>
              ) : (
                filtered.map((item) => {
                  const selected = value?.code === item.code
                  return (
                    <li key={item.code}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={cn(
                          'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-forest-50/60',
                          selected && 'bg-forest-50 text-forest-900',
                        )}
                        onClick={() => {
                          onSelect(item)
                          setOpen(false)
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {item.name}
                          </span>
                          {item.subtitle ? (
                            <span className="block truncate text-xs text-steel">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </span>
                        {selected ? (
                          <Check className="h-4 w-4 shrink-0 text-forest-700" />
                        ) : null}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}

      {loadError ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-red-600">{loadError}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={() => void onRetry()}
              className="text-xs font-semibold text-forest-700 hover:underline"
            >
              {locationStrings.retry}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
