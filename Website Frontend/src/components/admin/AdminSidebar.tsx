import {
  BarChart3,
  CreditCard,
  FileText,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/applications', label: 'Applications', icon: FileText },
  { to: '/admin/gram-sahakaris', label: 'Gram Sahakaris', icon: IdCard },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
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
          'fixed inset-0 z-40 bg-ink/40 transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-mist bg-white transition-all duration-200',
          collapsed ? 'w-[72px]' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Admin navigation"
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-mist px-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!collapsed && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-forest-500">
                Kisan Katta
              </p>
              <p className="text-sm font-semibold text-ink">Admin Portal</p>
            </div>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-steel hover:bg-forest-50 hover:text-forest-900 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-forest-50 text-forest-900'
                    : 'text-slate hover:bg-mist/60 hover:text-ink',
                  collapsed && 'justify-center px-2',
                )
              }
              title={label}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-mist p-3">
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate transition-colors hover:bg-red-50 hover:text-red-700',
              collapsed && 'justify-center px-2',
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" aria-hidden />
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
      onClick={onClick}
      className="rounded-lg p-2 text-slate hover:bg-mist/60 lg:hidden"
      aria-label="Open sidebar"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
