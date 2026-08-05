import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  FilterPanel,
  filterControlClass,
} from '@/components/admin/FilterPanel'
import { AdminCard, AdminPageHeader, formatDateTime } from '@/components/admin/AdminUI'
import { StatusBadge } from '@/components/application/StatusBadge'
import { useAdminApplications } from '@/hooks/useAdmin'
import { toVolunteerId } from '@/lib/gram-sahakari-id'
import { cn } from '@/lib/utils'
import type { ApplicationSummary } from '@/types/admin.types'

type HubView = 'all' | 'drafts' | 'payment_pending' | 'representatives'

const VIEWS: Array<{ id: HubView; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'payment_pending', label: 'Payment pending' },
  { id: 'representatives', label: 'Representatives' },
]

const PAYMENT_STATUSES = [
  '',
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'FAILED',
  'REFUNDED',
] as const

function parseView(raw: string | null): HubView {
  if (
    raw === 'drafts' ||
    raw === 'payment_pending' ||
    raw === 'representatives'
  ) {
    return raw
  }
  return 'all'
}

export function AdminGramSahakariPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const view = parseView(params.get('view'))

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const setView = (next: HubView) => {
    setPage(1)
    setPaymentStatus('')
    const nextParams = new URLSearchParams(params)
    if (next === 'all') nextParams.delete('view')
    else nextParams.set('view', next)
    setParams(nextParams, { replace: true })
  }

  const query = useMemo(() => {
    const base = {
      page,
      limit: 20,
      search: search || undefined,
      district: district || undefined,
      taluka: taluka || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    }

    if (view === 'drafts') {
      return { ...base, status: 'DRAFT' as const }
    }
    if (view === 'payment_pending') {
      return { ...base, status: 'PAYMENT_PENDING' as const }
    }
    if (view === 'representatives') {
      return {
        ...base,
        status: 'SUBMITTED' as const,
        paymentStatus: 'PAID' as const,
      }
    }
    return {
      ...base,
      paymentStatus: paymentStatus || undefined,
    }
  }, [
    page,
    search,
    view,
    paymentStatus,
    district,
    taluka,
    fromDate,
    toDate,
  ])

  const { data, isLoading, isFetching } = useAdminApplications(query)

  const activeFilters = [
    view === 'all' ? paymentStatus : '',
    district,
    taluka,
    fromDate,
    toDate,
  ].filter(Boolean).length

  const showVolunteerId = view === 'representatives'

  const columns: Column<ApplicationSummary>[] = [
    ...(showVolunteerId
      ? [
          {
            key: 'volunteerId',
            header: 'Volunteer ID',
            render: (row: ApplicationSummary) => (
              <span className="font-medium text-forest-900">
                {toVolunteerId(row.applicationNumber)}
              </span>
            ),
          } satisfies Column<ApplicationSummary>,
        ]
      : [
          {
            key: 'applicationNumber',
            header: 'Application',
            render: (row: ApplicationSummary) => (
              <Link
                to={`/admin/gram-sahakari/${row.id}`}
                className="font-medium text-forest-800 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.applicationNumber}
              </Link>
            ),
          } satisfies Column<ApplicationSummary>,
        ]),
    {
      key: 'fullName',
      header: showVolunteerId ? 'Name' : 'Applicant',
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
    ...(showVolunteerId
      ? []
      : [
          {
            key: 'status',
            header: 'Status',
            render: (row: ApplicationSummary) => (
              <StatusBadge
                kind="application"
                status={
                  row.status as 'DRAFT' | 'PAYMENT_PENDING' | 'SUBMITTED'
                }
              />
            ),
          } satisfies Column<ApplicationSummary>,
          {
            key: 'paymentStatus',
            header: 'Payment',
            render: (row: ApplicationSummary) => (
              <span className="text-xs font-medium text-steel">
                {row.paymentStatus}
              </span>
            ),
          } satisfies Column<ApplicationSummary>,
        ]),
    {
      key: 'createdAt',
      header: showVolunteerId ? 'Approved' : 'Date',
      hideOnMobile: true,
      render: (row) => formatDateTime(row.submittedAt ?? row.createdAt),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Gram Sahakari"
        description="Applications and approved Village Representatives in one place."
      />

      <div
        className="mb-4 flex flex-wrap gap-1 rounded-xl border border-mist bg-white p-1 shadow-soft"
        role="tablist"
        aria-label="Gram Sahakari views"
      >
        {VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'min-h-10 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              view === item.id
                ? 'bg-forest-50 text-forest-900'
                : 'text-steel hover:text-ink',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

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
            aria-label="Search Gram Sahakari"
          />
        </div>

        <FilterPanel activeCount={activeFilters}>
          {view === 'all' ? (
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
          ) : null}
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
          mobileTitleKey={showVolunteerId ? 'volunteerId' : 'applicationNumber'}
          emptyTitle={
            view === 'representatives'
              ? 'No approved Village Representatives yet'
              : 'No applications match your filters'
          }
          onRowClick={(row) => navigate(`/admin/gram-sahakari/${row.id}`)}
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

/** @deprecated Prefer AdminGramSahakariPage */
export const AdminApplicationsPage = AdminGramSahakariPage
