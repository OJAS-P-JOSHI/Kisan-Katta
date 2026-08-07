import {
  BarChart3,
  CreditCard,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sprout,
  X,
  Repeat,
  FileText,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/farmers', label: 'Farmers', icon: Sprout },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/gram-sahakari', label: 'Gram Sahakari', icon: IdCard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const

interface AdminSidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onLogout: () => void
}

export function AdminSidebar({
  open,
  collapsed,
  onClose,
  onLogout,
}: AdminSidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-mist bg-white shadow-lift transition-transform duration-250 ease-out lg:shadow-none',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Admin navigation"
      >
        <div
          className={cn(
            'flex h-14 items-center border-b border-mist px-4 sm:h-16',
            collapsed ? 'lg:justify-center' : 'justify-between',
          )}
        >
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-forest-500">
                Kissan Agrisathi
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                Admin Portal
              </p>
            </div>
          )}
          <button
            type="button"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-slate hover:bg-mist/70 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-2',
                  isActive
                    ? 'bg-forest-50 text-forest-900'
                    : 'text-slate hover:bg-mist/60 hover:text-ink',
                )
              }
              title={item.label}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-mist p-3">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate hover:bg-mist/60 hover:text-ink',
              collapsed && 'lg:justify-center lg:px-2',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export function AdminMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-slate hover:bg-mist/60 lg:hidden"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
