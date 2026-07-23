import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/application/StatusBadge'
import {
  AdminCard,
  StatCard,
  TableSkeleton,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { useAdminDashboard } from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'

export function AdminDashboardPage() {
  const { user } = useAuth()
  const { data, isLoading, isError } = useAdminDashboard()
  const name = user?.admin?.name ?? 'Administrator'

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-forest-500">Admin Dashboard</p>
        <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
          <span className="block text-lg font-medium text-steel sm:text-xl">
            Welcome back,
          </span>
          <span className="mt-1 block font-[family-name:Georgia,Cambria,'Times_New_Roman',serif] text-forest-900">
            {name}
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-steel">
          Overview of Gram Sahakari applications, payments, and registrations.
        </p>
      </div>

      {isError ? (
        <AdminCard>
          <p className="text-sm text-red-600">
            Unable to load dashboard summary. Please try again.
          </p>
        </AdminCard>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Applications"
          value={isLoading ? '—' : (data?.totalApplications ?? 0)}
        />
        <StatCard
          label="Draft"
          value={isLoading ? '—' : (data?.draft ?? 0)}
          tone="amber"
        />
        <StatCard
          label="Pending Payment"
          value={isLoading ? '—' : (data?.paymentPending ?? 0)}
          tone="blue"
        />
        <StatCard
          label="Submitted"
          value={isLoading ? '—' : (data?.submitted ?? 0)}
          tone="green"
        />
        <StatCard
          label="Total Revenue"
          value={isLoading ? '—' : formatInr(data?.totalRevenueInr ?? 0)}
          tone="green"
        />
        <StatCard
          label="Today's Registrations"
          value={isLoading ? '—' : (data?.todayRegistrations ?? 0)}
        />
        <StatCard
          label="Monthly Registrations"
          value={isLoading ? '—' : (data?.monthRegistrations ?? 0)}
        />
        <StatCard
          label="Payment Success Rate"
          value={isLoading ? '—' : `${data?.paymentSuccessRate ?? 0}%`}
        />
      </div>

      <div className="mt-6">
        <AdminCard
          title="Recent Applications"
          action={
            <Link
              to="/admin/applications"
              className="text-xs font-semibold text-forest-700 hover:underline"
            >
              View all
            </Link>
          }
        >
          {isLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-mist text-xs uppercase tracking-wide text-steel">
                    <th className="px-5 py-3 font-medium">Application</th>
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">District</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentApplications ?? []).map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-mist/80 hover:bg-forest-50/40"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/applications/${row.id}`}
                          className="font-medium text-forest-800 hover:underline"
                        >
                          {row.applicationNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{row.fullName ?? '—'}</td>
                      <td className="px-5 py-3">{row.district ?? '—'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          kind="application"
                          status={row.status as 'DRAFT' | 'PAYMENT_PENDING' | 'SUBMITTED'}
                        />
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-steel">
                        {row.paymentStatus}
                      </td>
                      <td className="px-5 py-3 text-xs text-steel">
                        {formatDateTime(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.recentApplications?.length ?? 0) === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-steel">
                  No applications yet.
                </p>
              ) : null}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
