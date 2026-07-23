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
    <div className="min-h-screen bg-[#F7F8F6] text-ink">
      <AdminSidebar
        open={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onLogout={() => void handleLogout()}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ search }} />
        </main>
      </div>
    </div>
  )
}
