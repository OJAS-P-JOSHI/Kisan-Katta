import { Bell, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { AdminMenuButton } from '@/components/admin/AdminSidebar'
import { firstName } from '@/components/admin/AdminUI'

interface AdminTopbarProps {
  adminName: string
  adminRole?: string
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenMobile: () => void
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit?: () => void
  notificationHref?: string
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function AdminTopbar({
  adminName,
  adminRole = 'Admin',
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  search,
  onSearchChange,
  onSearchSubmit,
  notificationHref = '/admin/payments',
}: AdminTopbarProps) {
  const now = useClock()
  const dateLabel = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeLabel = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <header className="sticky top-0 z-30 border-b border-mist bg-white/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-3 sm:min-h-16 sm:gap-3 sm:px-6">
        <AdminMenuButton onClick={onOpenMobile} />

        <button
          type="button"
          className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate hover:bg-mist/60 lg:inline-flex"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink sm:text-base">
            Welcome back, {firstName(adminName)}
          </p>
          <p className="truncate text-[11px] text-steel sm:text-xs">
            {dateLabel} · {timeLabel}
          </p>
        </div>

        <form
          className="relative hidden min-w-0 flex-[1.2] md:block md:max-w-sm lg:max-w-md"
          onSubmit={(e) => {
            e.preventDefault()
            onSearchSubmit?.()
          }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Mobile, payment ID, subscription ID…"
            className="min-h-11 w-full rounded-xl border border-mist bg-white py-2 pl-10 pr-3 text-sm text-ink outline-none ring-forest-500/30 placeholder:text-steel focus:ring-2"
            aria-label="Unified search"
          />
        </form>

        <Link
          to={notificationHref}
          className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate hover:bg-mist/60"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-900 sm:h-10 sm:w-10"
            aria-hidden
          >
            {initials(adminName)}
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium text-ink">{adminName}</p>
            <p className="text-[11px] text-steel">{adminRole.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-mist px-3 py-2 md:hidden">
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault()
            onSearchSubmit?.()
          }}
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search users, payments, subscriptions…"
            className="min-h-11 w-full rounded-xl border border-mist bg-[#F7F8F6] py-2 pl-10 pr-3 text-sm text-ink outline-none ring-forest-500/30 placeholder:text-steel focus:bg-white focus:ring-2"
            aria-label="Unified search"
          />
        </form>
      </div>
    </header>
  )
}
