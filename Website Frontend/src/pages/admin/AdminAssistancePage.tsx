import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  approveAdminAssistance,
  archiveAdminAssistance,
  listAdminAssistance,
  rejectAdminAssistance,
} from '@/api/admin.api'
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
import { adminKeys } from '@/hooks/useAdmin'
import { cn } from '@/lib/utils'
import type {
  AdminHelpRequest,
  HelpRequestStatus,
} from '@/types/assistance-admin.types'

const STATUS_OPTIONS: Array<{ value: HelpRequestStatus | ''; label: string }> = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'OPEN', label: 'Open' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: '', label: 'All statuses' },
]

function StatusBadge({ status }: { status: HelpRequestStatus }) {
  const styles: Record<HelpRequestStatus, string> = {
    PENDING_REVIEW: 'bg-amber-50 text-amber-900',
    OPEN: 'bg-forest-50 text-forest-900',
    RESOLVED: 'bg-slate-100 text-slate-700',
    REJECTED: 'bg-red-50 text-red-700',
    ARCHIVED: 'bg-mist text-steel',
  }
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {status.replaceAll('_', ' ')}
    </span>
  )
}

export function AdminAssistancePage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [status, setStatus] = useState<HelpRequestStatus | ''>('PENDING_REVIEW')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      district: district || undefined,
      status: status || undefined,
    }),
    [page, search, district, status],
  )

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [...adminKeys.all, 'assistance', query],
    queryFn: () => listAdminAssistance(query),
    placeholderData: (prev) => prev,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'assistance'] })

  const runAction = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string
      action: 'approve' | 'reject' | 'archive'
    }) => {
      setBusyId(id)
      if (action === 'approve') return approveAdminAssistance(id)
      if (action === 'reject') return rejectAdminAssistance(id)
      return archiveAdminAssistance(id)
    },
    onSuccess: (_data, variables) => {
      setMessage(
        variables.action === 'approve'
          ? 'Request approved — it is now visible in the farmer feed.'
          : variables.action === 'reject'
            ? 'Request rejected and hidden from the public feed.'
            : 'Request archived and hidden from the public feed.',
      )
      void invalidate()
    },
    onError: () => {
      setMessage('Moderation action failed. Please try again.')
    },
    onSettled: () => setBusyId(null),
  })

  const columns: Column<AdminHelpRequest>[] = [
    {
      key: 'title',
      header: 'Request',
      render: (row) => (
        <div className="max-w-xs">
          <p className="font-medium text-ink">{row.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-steel">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Farmer',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.author.name}</p>
          <p className="text-xs text-steel">
            {row.author.village}, {row.author.district}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'counts',
      header: 'Signals',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm text-slate">
          {row.supportCount} support · {row.reportCount} reports
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => formatDateTime(row.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const disabled = busyId === row.id || runAction.isPending
        const canApprove = row.status === 'PENDING_REVIEW'
        const canReject =
          row.status === 'PENDING_REVIEW' || row.status === 'OPEN'
        const canArchive = row.status !== 'ARCHIVED'
        return (
          <div className="flex flex-wrap gap-1.5">
            {canApprove ? (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  runAction.mutate({ id: row.id, action: 'approve' })
                }}
                className="rounded-lg bg-forest-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-forest-800 disabled:opacity-50"
              >
                Approve
              </button>
            ) : null}
            {canReject ? (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  runAction.mutate({ id: row.id, action: 'reject' })
                }}
                className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
            ) : null}
            {canArchive ? (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  runAction.mutate({ id: row.id, action: 'archive' })
                }}
                className="rounded-lg bg-mist px-2.5 py-1.5 text-xs font-medium text-slate hover:bg-slate-200 disabled:opacity-50"
              >
                Archive
              </button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const activeFilters = [search, district, status !== 'PENDING_REVIEW' ? status : '']
    .filter(Boolean).length

  return (
    <div>
      <AdminPageHeader
        title="Farmer Assistance"
        description="Approve help requests before they appear in the public farmer feed. Pending requests are invisible to other farmers."
      />

      {message ? (
        <div className="mb-4 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-900">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load assistance queue. Check that your account has the
          assistance permission.
        </div>
      ) : null}

      <AdminCard>
        <div className="mb-3">
          <input
            className={filterControlClass}
            placeholder="Search title, description, village…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            aria-label="Search help requests"
          />
        </div>

        <FilterPanel activeCount={activeFilters}>
          <input
            className={filterControlClass}
            placeholder="District"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value)
              setPage(1)
            }}
          />
          <select
            className={filterControlClass}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as HelpRequestStatus | '')
              setPage(1)
            }}
            aria-label="Status filter"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterPanel>

        <DataTable
          columns={columns}
          rows={data?.requests ?? []}
          rowKey={(row) => row.id}
          loading={isLoading || (isFetching && !data)}
          emptyTitle="No help requests in this queue"
          emptyDescription="New farmer submissions appear here as Pending review."
          mobileTitleKey="title"
        />

        <Pagination
          page={data?.pagination.page ?? page}
          totalPages={data?.pagination.totalPages ?? 1}
          total={data?.pagination.total ?? 0}
          onPageChange={setPage}
        />
      </AdminCard>
    </div>
  )
}
