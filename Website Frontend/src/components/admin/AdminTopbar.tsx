import { Bell, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'

import { AdminMenuButton } from '@/components/admin/AdminSidebar'

interface AdminTopbarProps {
  adminName: string
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenMobile: () => void
  search: string
  onSearchChange: (value: string) => void
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminTopbar({
  adminName,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  search,
  onSearchChange,
}: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-mist bg-white/95 px-4 backdrop-blur sm:px-6">
      <AdminMenuButton onClick={onOpenMobile} />

      <button
        type="button"
        className="hidden rounded-lg p-2 text-slate hover:bg-mist/60 lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </button>

      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search applications, volunteers…"
          className="w-full rounded-xl border border-mist bg-white py-2 pl-10 pr-3 text-sm text-ink outline-none ring-forest-500/30 placeholder:text-steel focus:ring-2"
          aria-label="Search"
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <p className="hidden text-xs text-steel xl:block">{formatDate(new Date())}</p>

        <button
          type="button"
          className="relative rounded-lg p-2 text-slate hover:bg-mist/60"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-forest-500" />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-900"
            aria-hidden
          >
            {initials(adminName)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-ink">{adminName}</p>
            <p className="text-[11px] text-steel">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  )
}
