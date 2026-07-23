import { LogOut } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

import {
  AccountStatusBadge,
  AdminPageHeader,
  InfoGrid,
  ProfileSection,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { useAdminMe, useAdminSystemInfo } from '@/hooks/useAdmin'

type OutletCtx = { onLogout?: () => Promise<void> }

export function AdminSettingsPage() {
  const { data: admin } = useAdminMe()
  const { data: system, isLoading: systemLoading } = useAdminSystemInfo()
  const outlet = useOutletContext<OutletCtx>()

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Admin profile and system information."
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileSection title="Admin Profile">
          {admin ? (
            <InfoGrid
              items={[
                { label: 'Name', value: admin.name },
                { label: 'Phone', value: admin.phoneNumber },
                { label: 'Email', value: admin.email },
                { label: 'Role', value: admin.role },
                {
                  label: 'Status',
                  value: (
                    <AccountStatusBadge
                      status={admin.isActive ? 'ACTIVE' : 'INACTIVE'}
                    />
                  ),
                },
                {
                  label: 'Last Login',
                  value: formatDateTime(admin.lastLoginAt),
                },
                {
                  label: 'Account Created',
                  value: formatDateTime(admin.createdAt),
                },
              ]}
            />
          ) : (
            <p className="text-sm text-steel">Loading profile…</p>
          )}
        </ProfileSection>

        <ProfileSection title="Office Address">
          {admin ? (
            <InfoGrid
              items={[
                { label: 'Address', value: admin.address.line1 },
                { label: 'Taluka', value: admin.address.taluka },
                { label: 'District', value: admin.address.district },
                { label: 'City', value: admin.address.city },
                { label: 'State', value: admin.address.state },
                { label: 'PIN', value: admin.address.pincode },
              ]}
            />
          ) : (
            <p className="text-sm text-steel">Loading address…</p>
          )}
        </ProfileSection>

        <ProfileSection title="System Information" className="lg:col-span-2">
          {systemLoading ? (
            <p className="text-sm text-steel">Checking system status…</p>
          ) : (
            <InfoGrid
              columns={3}
              items={[
                {
                  label: 'Backend Version',
                  value: system?.backendVersion ?? '—',
                },
                {
                  label: 'Frontend Version',
                  value: system?.frontendVersion ?? '0.0.0',
                },
                {
                  label: 'Database Status',
                  value: system?.databaseStatus ?? '—',
                },
                { label: 'API Status', value: system?.apiStatus ?? '—' },
                {
                  label: 'Server Time',
                  value: formatDateTime(system?.serverTime),
                },
                {
                  label: 'Environment',
                  value: system?.environment ?? '—',
                },
              ]}
            />
          )}
        </ProfileSection>

        <ProfileSection title="Quick Actions" className="lg:col-span-2">
          <button
            type="button"
            onClick={() => void outlet.onLogout?.()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </ProfileSection>
      </div>
    </div>
  )
}
