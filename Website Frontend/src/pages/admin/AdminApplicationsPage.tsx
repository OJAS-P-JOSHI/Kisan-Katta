import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  FilterPanel,
  filterControlClass,
} from '@/components/admin/FilterPanel'
import { AdminCard, AdminPageHeader, formatDateTime } from '@/components/admin/AdminUI'
import { StatusBadge } from '@/components/application/StatusBadge'
import { useAdminApplications } from '@/hooks/useAdmin'
import type { ApplicationSummary } from '@/types/admin.types'

const STATUSES = ['', 'DRAFT', 'PAYMENT_PENDING', 'SUBMITTED'] as const
const PAYMENT_STATUSES = [
  '',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const

export function AdminApplicationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      district: district || undefined,
      taluka: taluka || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }),
    [page, search, status, paymentStatus, district, taluka, fromDate, toDate],
  )

  const { data, isLoading, isFetching } = useAdminApplications(query)
  const activeFilters = [
    status,
    paymentStatus,
    district,
    taluka,
    fromDate,
    toDate,
  ].filter(Boolean).length

  const columns: Column<ApplicationSummary>[] = [
    {
      key: 'applicationNumber',
      header: 'Application',
      render: (row) => (
        <Link
          to={`/admin/applications/${row.id}`}
          className="font-medium text-forest-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.applicationNumber}
        </Link>
      ),
    },
    {
      key: 'fullName',
      header: 'Applicant',
      render: (row) => row.fullName ?? '—',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => row.phoneNumber ?? row.phone ?? '—',
    },
    {
      key: 'district',
      header: 'District',
      render: (row) => row.district ?? '—',
    },
    {
      key: 'taluka',
      header: 'Taluka',
      hideOnMobile: true,
      render: (row) => row.taluka ?? '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          kind="application"
          status={row.status as 'DRAFT' | 'PAYMENT_PENDING' | 'SUBMITTED'}
        />
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <span className="text-xs font-medium text-steel">{row.paymentStatus}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      hideOnMobile: true,
      render: (row) => formatDateTime(row.submittedAt ?? row.createdAt),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Applications"
        description="Search, filter, and review Gram Sahakari applications."
      />

      <AdminCard>
        <div className="mb-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Search name, phone, ID…"
            className={filterControlClass}
            aria-label="Search applications"
          />
        </div>

        <FilterPanel activeCount={activeFilters}>
          <select
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
            className={filterControlClass}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPage(1)
              setPaymentStatus(e.target.value)
            }}
            className={filterControlClass}
            aria-label="Filter by payment status"
          >
            <option value="">All payments</option>
            {PAYMENT_STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={district}
            onChange={(e) => {
              setPage(1)
              setDistrict(e.target.value)
            }}
            placeholder="District"
            className={filterControlClass}
          />
          <input
            value={taluka}
            onChange={(e) => {
              setPage(1)
              setTaluka(e.target.value)
            }}
            placeholder="Taluka"
            className={filterControlClass}
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPage(1)
              setFromDate(e.target.value)
            }}
            className={filterControlClass}
            aria-label="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPage(1)
              setToDate(e.target.value)
            }}
            className={filterControlClass}
            aria-label="To date"
          />
        </FilterPanel>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          loading={isLoading || (isFetching && !data)}
          rowKey={(row) => row.id}
          mobileTitleKey="applicationNumber"
          emptyTitle="No applications match your filters"
          onRowClick={(row) => navigate(`/admin/applications/${row.id}`)}
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
