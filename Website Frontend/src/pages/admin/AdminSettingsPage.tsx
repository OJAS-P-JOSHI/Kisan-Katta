import { AdminCard, AdminPageHeader, formatDateTime } from '@/components/admin/AdminUI'
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/i18n/LanguageProvider'

export function AdminSettingsPage() {
  const { user } = useAuth()
  const { locale } = useLanguage()
  const admin = user?.admin

  return (
    <div>
      <AdminPageHeader
        title="Settings"
        description="Admin profile, preferences, and system information."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Admin profile">
          {admin ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Name</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{admin.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Role</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{admin.role}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Phone</dt>
                <dd className="mt-1 text-sm text-ink">{admin.phoneNumber}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Email</dt>
                <dd className="mt-1 text-sm text-ink">{admin.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wide text-steel">Address</dt>
                <dd className="mt-1 text-sm text-ink">
                  {admin.address.line1}, {admin.address.taluka}, {admin.address.district},{' '}
                  {admin.address.city}, {admin.address.state} {admin.address.pincode}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Last login</dt>
                <dd className="mt-1 text-sm text-ink">
                  {formatDateTime(admin.lastLoginAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-steel">Status</dt>
                <dd className="mt-1 text-sm font-medium text-forest-700">
                  {admin.isActive ? 'ACTIVE' : 'INACTIVE'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-steel">Admin profile unavailable.</p>
          )}
        </AdminCard>

        <AdminCard title="Preferences">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-steel">
                Language
              </p>
              <div className="mt-2">
                <LanguageToggle />
              </div>
              <p className="mt-2 text-xs text-steel">
                Current: {locale === 'mr' ? 'Marathi' : 'English'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-steel">
                Theme
              </p>
              <p className="mt-2 text-sm text-ink">
                Light (Admin) — dark theme reserved for a future release.
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="System information" className="lg:col-span-2">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-steel">Portal</dt>
              <dd className="mt-1 text-sm text-ink">Kisan Katta Admin</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-steel">Phase</dt>
              <dd className="mt-1 text-sm text-ink">Phase-2 · Admin Dashboard</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-steel">Permissions</dt>
              <dd className="mt-1 text-sm text-ink">
                {admin?.permissions.join(', ') ?? '—'}
              </dd>
            </div>
          </dl>
        </AdminCard>
      </div>
    </div>
  )
}
