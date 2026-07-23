import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')

  const adminName = user?.admin?.name ?? 'Administrator'

  const handleLogout = async (): Promise<void> => {
    await logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#F7F8F6] text-ink">
      <AdminSidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onLogout={() => void handleLogout()}
      />

      <div
        className={cn(
          'flex min-h-dvh max-w-[100vw] flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
        )}
      >
        <AdminTopbar
          adminName={adminName}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onOpenMobile={() => setMobileOpen(true)}
          search={search}
          onSearchChange={setSearch}
        />

        <main className="mx-auto w-full max-w-[1400px] flex-1 overflow-x-hidden p-3 sm:p-5 lg:p-8">
          <Outlet context={{ search, onLogout: handleLogout }} />
        </main>
      </div>
    </div>
  )
}
