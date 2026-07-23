import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { useAdminPayments } from '@/hooks/useAdmin'
import type { PaymentListItem } from '@/types/admin.types'

const PAYMENT_STATUSES = [
  '',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const

export function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      paymentStatus: paymentStatus || undefined,
    }),
    [page, search, paymentStatus],
  )

  const { data, isLoading, isFetching } = useAdminPayments(query)

  const columns: Column<PaymentListItem>[] = [
    {
      key: 'razorpayPaymentId',
      header: 'Payment ID',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.razorpayPaymentId ?? '—'}
        </span>
      ),
    },
    {
      key: 'razorpayOrderId',
      header: 'Order ID',
      render: (row) => (
        <span className="font-mono text-xs">{row.razorpayOrderId ?? '—'}</span>
      ),
    },
    {
      key: 'amountInr',
      header: 'Amount',
      render: (row) => formatInr(row.amountInr),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (row) => (
        <span className="rounded-full border border-mist px-2.5 py-0.5 text-xs font-medium">
          {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'application',
      header: 'Application',
      render: (row) => (
        <div>
          <Link
            to={`/admin/applications/${row.applicationId}`}
            className="font-medium text-forest-800 hover:underline"
          >
            {row.applicationNumber}
          </Link>
          <p className="text-xs text-steel">{row.fullName ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Date',
      render: (row) => formatDateTime(row.paidAt ?? row.updatedAt),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Payments"
        description="Read-only payment records from Gram Sahakari applications."
      />

      <AdminCard>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Search payment / order / application…"
            className="rounded-xl border border-mist px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500/30 lg:col-span-2"
          />
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPage(1)
              setPaymentStatus(e.target.value)
            }}
            className="rounded-xl border border-mist px-3 py-2 text-sm"
            aria-label="Filter by payment status"
          >
            <option value="">All statuses</option>
            {PAYMENT_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          loading={isLoading || (isFetching && !data)}
          rowKey={(row) =>
            `${row.applicationId}-${row.razorpayPaymentId ?? row.updatedAt}`
          }
          emptyTitle="No payment records found"
        />
        <Pagination
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </AdminCard>
    </div>
  )
}
