import { Link } from 'react-router-dom'

import { StatusBadge } from '@/components/application/StatusBadge'
import {
  AccountStatusBadge,
  AdminCard,
  StatCard,
  TableSkeleton,
  firstName,
  formatDate,
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
    <div className="overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <p className="text-sm font-medium text-forest-500">Admin Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
          <span className="block text-base font-medium text-steel sm:text-lg">
            Welcome back,
          </span>
          <span className="mt-1 block font-[family-name:Georgia,Cambria,'Times_New_Roman',serif] text-forest-900">
            {firstName(name)}
          </span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-steel">
          Farmers, Gram Sahakaris, applications, and revenue at a glance.
        </p>
      </div>

      {isError ? (
        <AdminCard>
          <p className="text-sm text-red-600">
            Unable to load dashboard summary. Please try again.
          </p>
        </AdminCard>
      ) : null}

      <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Farmers"
          value={isLoading ? '—' : (data?.totalFarmers ?? 0)}
          tone="green"
        />
        <StatCard
          label="Total Gram Sahakaris"
          value={isLoading ? '—' : (data?.totalGramSahakaris ?? 0)}
          tone="green"
        />
        <StatCard
          label="Applications"
          value={isLoading ? '—' : (data?.totalApplications ?? 0)}
        />
        <StatCard
          label="Pending Payments"
          value={isLoading ? '—' : (data?.paymentPending ?? 0)}
          tone="amber"
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
          label="Revenue"
          value={isLoading ? '—' : formatInr(data?.totalRevenueInr ?? 0)}
          tone="green"
        />
        <StatCard
          label="Payment Success"
          value={isLoading ? '—' : `${data?.paymentSuccessRate ?? 0}%`}
          tone="blue"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:mt-6 lg:grid-cols-2">
        <AdminCard
          title="Recent Registrations"
          action={
            <Link
              to="/admin/farmers"
              className="text-xs font-semibold text-forest-700 hover:underline"
            >
              View farmers
            </Link>
          }
          padded={false}
        >
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} />
            </div>
          ) : (
            <ul className="divide-y divide-mist">
              {(data?.recentFarmers ?? []).map((farmer) => (
                <li key={farmer.id}>
                  <Link
                    to={`/admin/farmers/${farmer.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-forest-50/40 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {farmer.name}
                      </p>
                      <p className="truncate text-xs text-steel">
                        {farmer.village}, {farmer.district}
                        {farmer.mobile ? ` · ${farmer.mobile}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <AccountStatusBadge status={farmer.accountStatus} />
                      <p className="mt-1 text-[11px] text-steel">
                        {formatDate(farmer.registeredAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {(data?.recentFarmers?.length ?? 0) === 0 ? (
                <li className="px-5 py-10 text-center text-sm text-steel">
                  No farmer registrations yet.
                </li>
              ) : null}
            </ul>
          )}
        </AdminCard>

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
          padded={false}
        >
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-y border-mist text-[11px] uppercase tracking-wide text-steel">
                    <th className="px-4 py-3 font-medium sm:px-5">App</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Name</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell sm:px-5">
                      Phone
                    </th>
                    <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentApplications ?? []).map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-mist/80 hover:bg-forest-50/40"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <Link
                          to={`/admin/applications/${row.id}`}
                          className="font-medium text-forest-800 hover:underline"
                        >
                          {row.applicationNumber}
                        </Link>
                        <p className="text-[11px] text-steel sm:hidden">
                          {formatDateTime(row.createdAt)}
                        </p>
                      </td>
                      <td className="max-w-[8rem] truncate px-4 py-3 sm:max-w-none sm:px-5">
                        {row.fullName ?? '—'}
                      </td>
                      <td className="hidden px-4 py-3 tabular-nums sm:table-cell sm:px-5">
                        {row.phoneNumber ?? '—'}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <StatusBadge
                          kind="application"
                          status={
                            row.status as
                              | 'DRAFT'
                              | 'PAYMENT_PENDING'
                              | 'SUBMITTED'
                          }
                        />
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
