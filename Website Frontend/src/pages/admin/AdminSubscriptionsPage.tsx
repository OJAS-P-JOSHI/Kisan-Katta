import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  listAdminSubscriptions,
  syncAdminSubscription,
} from '@/api/admin-ops.api'
import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  FilterPanel,
  filterControlClass,
} from '@/components/admin/FilterPanel'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-error'

export function AdminSubscriptionsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
    }),
    [page, search, status],
  )

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin', 'subscriptions', query],
    queryFn: () => listAdminSubscriptions(query),
    placeholderData: (prev) => prev,
  })

  const sync = useMutation({
    mutationFn: (id: string) => syncAdminSubscription(id, 'list_sync'),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] }),
  })

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <Link
          to={`/admin/users/${String(row.userId)}?tab=subscription`}
          className="font-medium text-forest-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(row.userName ?? row.userMobile ?? row.userId)}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => String(row.status),
    },
    {
      key: 'active',
      header: 'Premium',
      render: (row) => (row.isActive ? 'Yes' : 'No'),
    },
    {
      key: 'subscriptionId',
      header: 'Subscription ID',
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-xs">{String(row.subscriptionId ?? '—')}</span>
      ),
    },
    {
      key: 'period',
      header: 'Period end',
      render: (row) => formatDateTime(row.currentPeriodEnd as string | null),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          disabled={sync.isPending}
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm('Sync from Razorpay?')) {
              sync.mutate(String(row.id))
            }
          }}
        >
          Sync
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Subscriptions"
        description="Manage farmer premium subscriptions, sync, cancel, and refund from the user vault."
      />

      <AdminCard padded={false}>
        <div className="p-4 sm:p-5">
          <div className="mb-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Mobile, subscription ID, payment ID…"
              className={filterControlClass}
              aria-label="Search subscriptions"
            />
          </div>
          <FilterPanel activeCount={status ? 1 : 0}>
            <select
              className={filterControlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {[
                'CREATED',
                'AUTHENTICATED',
                'ACTIVE',
                'PENDING',
                'HALTED',
                'CANCELLED',
                'PAUSED',
                'COMPLETED',
                'EXPIRED',
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="text-xs text-steel underline"
              onClick={() => {
                setStatus('')
                setPage(1)
              }}
            >
              Clear
            </button>
          </FilterPanel>
        </div>
      </AdminCard>

      {error ? (
        <AdminCard>
          <p className="text-sm text-red-700">
            {getErrorMessage(error, 'Failed to load subscriptions.')}
          </p>
        </AdminCard>
      ) : (
        <AdminCard padded={false}>
          <DataTable
            columns={columns}
            rows={(data?.items as Array<Record<string, unknown>>) ?? []}
            loading={isLoading || isFetching}
            rowKey={(row) => String(row.id ?? row.subscriptionId ?? row.userId)}
            emptyTitle="No subscriptions found"
            onRowClick={(row) =>
              navigate(`/admin/users/${String(row.userId)}?tab=subscription`)
            }
          />
          <Pagination
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </AdminCard>
      )}
    </div>
  )
}
