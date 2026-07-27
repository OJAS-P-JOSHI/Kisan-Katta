import { Link } from 'react-router-dom'

import { DataTable, type Column } from '@/components/admin/DataTable'
import { formatDate, formatInr } from '@/components/admin/AdminUI'
import { RewardStatusBadge } from '@/components/admin/rewards/RewardStatusBadge'
import {
  REWARD_PAYMENT_METHOD_LABELS,
  type RewardListItem,
} from '@/types/reward.types'

type Props = {
  rows: RewardListItem[]
  loading?: boolean
  canManage?: boolean
  onMarkPaid?: (row: RewardListItem) => void
  onCancel?: (row: RewardListItem) => void
}

export function RewardHistoryTable({
  rows,
  loading,
  canManage,
  onMarkPaid,
  onCancel,
}: Props) {
  const columns: Column<RewardListItem>[] = [
    {
      key: 'rewardId',
      header: 'Reward ID',
      render: (row) => (
        <Link
          to={`/admin/rewards/${row.id}`}
          className="font-mono text-xs font-medium text-forest-800 hover:underline"
        >
          {row.rewardId}
        </Link>
      ),
    },
    {
      key: 'villageRepresentativeName',
      header: 'Village Representative',
      render: (row) => (
        <div className="min-w-0">
          <Link
            to={`/admin/applications/${row.applicationId}`}
            className="block truncate font-medium text-ink hover:text-forest-800"
          >
            {row.villageRepresentativeName}
          </Link>
          <p className="truncate text-xs text-steel">
            {[row.village, row.taluka].filter(Boolean).join(', ') || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'volunteerId',
      header: 'Volunteer ID',
      render: (row) => (
        <span className="font-mono text-xs">{row.volunteerId}</span>
      ),
    },
    {
      key: 'district',
      header: 'District',
      render: (row) => row.district ?? '—',
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className="font-medium tabular-nums">{formatInr(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <RewardStatusBadge status={row.status} />,
    },
    {
      key: 'paymentMethod',
      header: 'Payment Method',
      render: (row) => REWARD_PAYMENT_METHOD_LABELS[row.paymentMethod],
    },
    {
      key: 'approvedBy',
      header: 'Approved By',
      render: (row) => (
        <span className="text-xs text-steel">{row.approvedBy ?? '—'}</span>
      ),
    },
    {
      key: 'paidDate',
      header: 'Paid Date',
      render: (row) => (row.paidDate ? formatDate(row.paidDate) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/admin/rewards/${row.id}`}
            className="text-xs font-semibold text-forest-700 hover:underline"
          >
            View
          </Link>
          {canManage && row.status === 'PENDING' ? (
            <>
              <button
                type="button"
                onClick={() => onMarkPaid?.(row)}
                className="text-xs font-semibold text-forest-800 hover:underline"
              >
                Mark as Paid
              </button>
              <button
                type="button"
                onClick={() => onCancel?.(row)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Cancel
              </button>
            </>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      rowKey={(row) => row.id}
      emptyTitle="No rewards have been recorded yet."
      emptyDescription="Create a reward to recognise and track payments made to Village Representatives."
    />
  )
}
