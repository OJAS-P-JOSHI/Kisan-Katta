import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listPaymentCenter } from '@/api/admin-ops.api'
import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import { filterControlClass } from '@/components/admin/FilterPanel'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { getErrorMessage } from '@/lib/api-error'

export function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<'ALL' | 'GS' | 'SUBSCRIPTION'>('ALL')
  const [status, setStatus] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      source,
      status: status || undefined,
    }),
    [page, search, source, status],
  )

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin', 'payments-center', query],
    queryFn: () => listPaymentCenter(query),
    placeholderData: (prev) => prev,
  })

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (row) => String(row.source),
    },
    {
      key: 'paymentId',
      header: 'Payment ID',
      render: (row) => (
        <span className="font-mono text-xs">{String(row.paymentId ?? '—')}</span>
      ),
    },
    {
      key: 'orderId',
      header: 'Order / Sub',
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-xs">
          {String(row.orderId ?? row.subscriptionId ?? '—')}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) =>
        formatInr(
          typeof row.amountPaise === 'number' ? row.amountPaise / 100 : 0,
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => String(row.status),
    },
    {
      key: 'refundId',
      header: 'Refund ID',
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-xs">{String(row.refundId ?? '—')}</span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) =>
        row.userId ? (
          <Link
            to={`/admin/users/${String(row.userId)}?tab=payments`}
            className="text-forest-800 hover:underline"
          >
            Open vault
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'related',
      header: 'Related',
      render: (row) =>
        row.applicationId ? (
          <Link
            to={`/admin/gram-sahakari/${String(row.applicationId)}`}
            className="text-forest-800 hover:underline"
          >
            {String(row.applicationNumber)}
          </Link>
        ) : row.userId ? (
          <Link
            to={`/admin/users/${String(row.userId)}?tab=subscription`}
            className="text-forest-800 hover:underline"
          >
            Subscription
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row) => formatDateTime(String(row.updatedAt)),
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Payment Center"
        description="Gram Sahakari fees and subscription billing in one place."
      />

      <AdminCard padded={false}>
        <div className="space-y-3 p-4 sm:p-5">
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Payment ID, order ID, subscription ID, application number…"
            className={filterControlClass}
          />
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'GS', 'SUBSCRIPTION'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSource(s)
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  source === s
                    ? 'bg-forest-800 text-white'
                    : 'border border-mist text-slate'
                }`}
              >
                {s}
              </button>
            ))}
            <select
              className={filterControlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED'].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {error ? (
          <p className="px-4 pb-4 text-sm text-red-700">
            {getErrorMessage(error, 'Failed to load payments.')}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={(data?.items as Array<Record<string, unknown>>) ?? []}
              loading={isLoading || isFetching}
              rowKey={(row) =>
                String(
                  row.paymentId ??
                    `${String(row.source)}-${String(row.userId)}-${String(row.updatedAt)}`,
                )
              }
              emptyTitle="No payments found"
            />
            <div className="px-4 pb-4">
              <Pagination
                page={data?.page ?? page}
                totalPages={data?.totalPages ?? 0}
                total={data?.total ?? 0}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </AdminCard>
    </div>
  )
}
