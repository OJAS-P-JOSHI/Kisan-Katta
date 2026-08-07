import { useMemo, useState, useEffect } from 'react'
import { Download, Gift, LoaderCircle, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'

import {
  AdminCard,
  AdminPageHeader,
  EmptyState,
  formatDate,
  formatInr,
} from '@/components/admin/AdminUI'
import { Pagination } from '@/components/admin/DataTable'
import { RewardFilters } from '@/components/admin/rewards/RewardFilters'
import { RewardForm } from '@/components/admin/rewards/RewardForm'
import { RewardHistoryTable } from '@/components/admin/rewards/RewardHistoryTable'
import { RewardSummaryCards } from '@/components/admin/rewards/RewardSummaryCards'
import { useToast } from '@/components/common/Toast'
import { downloadRewardsCsv } from '@/api/reward.api'
import { useAdminMe } from '@/hooks/useAdmin'
import {
  useCancelReward,
  useCreateReward,
  useMarkRewardPaid,
  useRewardSummary,
  useRewards,
} from '@/hooks/useRewards'
import { getErrorMessage } from '@/lib/api-error'
import type {
  CreateRewardInput,
  RewardListItem,
  RewardListQuery,
} from '@/types/reward.types'
import { REWARD_PAYMENT_METHOD_LABELS } from '@/types/reward.types'

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

function MarkPaidDialog({
  reward,
  onClose,
  onConfirm,
  submitting,
}: {
  reward: RewardListItem
  onClose: () => void
  onConfirm: (input: {
    transactionReference?: string
    paidDate: string
    notes?: string
  }) => Promise<void>
  submitting?: boolean
}) {
  const [txn, setTxn] = useState('')
  const [paidDate, setPaidDate] = useState(todayInput())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-mist bg-white shadow-lift sm:rounded-2xl">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Mark as Paid</h2>
          <p className="mt-1 text-sm text-steel">
            Confirm that you have already transferred{' '}
            <strong>{formatInr(reward.amount)}</strong> to{' '}
            {reward.villageRepresentativeName} outside this system. This only
            updates the record — it does not send money.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-steel">
              Transaction Reference
            </label>
            <input
              value={txn}
              onChange={(e) => setTxn(e.target.value)}
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm disabled:opacity-60"
              placeholder="UTR / UPI ref / cheque no."
              disabled={submitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-steel">
              Paid Date
            </label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm disabled:opacity-60"
              required
              disabled={submitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-steel">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm disabled:opacity-60"
              placeholder="Optional internal remarks."
              disabled={submitting}
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-mist px-5 py-4 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-11 rounded-xl border border-mist px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting || !paidDate}
            onClick={async () => {
              try {
                setError(null)
                await onConfirm({
                  transactionReference: txn.trim() || undefined,
                  paidDate,
                  notes: notes.trim() || undefined,
                })
                onClose()
              } catch (err) {
                setError(getErrorMessage(err, 'Unable to mark as paid.'))
              }
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Mark as Paid'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminRewardsPage() {
  const navigate = useNavigate()
  const { data: admin } = useAdminMe()
  const { success, error: toastError } = useToast()
  const canManage = admin?.role === 'SUPER_ADMIN'

  const [filters, setFilters] = useState<RewardListQuery>({ page: 1, limit: 20 })
  const [createOpen, setCreateOpen] = useState(false)
  const [markPaidRow, setMarkPaidRow] = useState<RewardListItem | null>(null)
  const [exporting, setExporting] = useState(false)

  const query = useMemo(
    () => ({
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
    }),
    [filters],
  )

  const { data, isLoading, isFetching, isError } = useRewards(query)
  const { data: summary, isLoading: summaryLoading } = useRewardSummary()
  const createMutation = useCreateReward()
  const markPaidMutation = useMarkRewardPaid()
  const cancelMutation = useCancelReward()

  const handleCreate = async (input: CreateRewardInput) => {
    const created = await createMutation.mutateAsync(input)
    success('Reward created successfully.')
    setCreateOpen(false)
    navigate(`/admin/rewards/${created.id}`)
    return { id: created.id }
  }

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      await downloadRewardsCsv(query, `kissan-agrisathi-rewards-${Date.now()}.csv`)
      success('CSV downloaded.')
    } catch (err) {
      toastError(getErrorMessage(err, 'Unable to export CSV.'))
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('Kissan Agrisathi — Reward History', 14, 18)
    doc.setFontSize(9)
    doc.text(`Exported ${new Date().toLocaleString()}`, 14, 24)
    let y = 34
    for (const row of data?.items ?? []) {
      if (y > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(
        `${row.rewardId} | ${row.villageRepresentativeName} | ${formatInr(row.amount)} | ${row.status} | ${row.paidDate ? formatDate(row.paidDate) : '—'}`,
        14,
        y,
      )
      y += 7
    }
    doc.save(`kissan-agrisathi-rewards-${Date.now()}.pdf`)
  }

  return (
    <div className="overflow-x-hidden">
      <AdminPageHeader
        title="Rewards"
        description="Manual Village Representative reward records. Transfers happen outside the system — this module only keeps history."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest-800 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-900"
              >
                <Plus className="h-4 w-4" />
                Create Reward
              </button>
            ) : null}
          </div>
        }
      />

      <div className="mb-5">
        <RewardSummaryCards summary={summary} loading={summaryLoading} />
      </div>

      {summary?.recentRewards?.length ? (
        <AdminCard
          title="Recent Rewards"
          className="mb-5"
          action={
            <span className="text-xs font-medium text-steel">Latest 5</span>
          }
          padded={false}
        >
          <ul className="divide-y divide-mist">
            {summary.recentRewards.slice(0, 5).map((r) => (
              <li key={r.id}>
                <Link
                  to={`/admin/rewards/${r.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-forest-50/40 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {r.villageRepresentativeName}
                    </p>
                    <p className="truncate text-xs text-steel">
                      {r.rewardId} · {r.reason}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatInr(r.amount)}
                    </p>
                    <p className="text-[11px] text-steel">{r.status}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <AdminCard>
        <RewardFilters value={filters} onChange={setFilters} />
        {isError ? (
          <EmptyState
            title="Unable to load rewards"
            description="Please refresh the page and try again."
          />
        ) : (
          <RewardHistoryTable
            rows={data?.items ?? []}
            loading={isLoading || (isFetching && !data)}
            canManage={canManage}
            onMarkPaid={setMarkPaidRow}
            onCancel={async (row) => {
              if (
                !window.confirm(
                  `Cancel reward ${row.rewardId} for ${row.villageRepresentativeName}?`,
                )
              ) {
                return
              }
              try {
                await cancelMutation.mutateAsync({ id: row.id })
                success('Reward cancelled.')
              } catch (err) {
                toastError(getErrorMessage(err, 'Unable to cancel reward.'))
              }
            }}
          />
        )}
        <Pagination
          page={data?.page ?? query.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
        />
        <p className="mt-3 text-[11px] text-steel">
          Payment methods in use:{' '}
          {Object.values(REWARD_PAYMENT_METHOD_LABELS).join(' · ')}. No Razorpay
          or payout API is involved.
        </p>
      </AdminCard>

      {!isLoading && !isError && (data?.total ?? 0) === 0 && canManage ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest-800 hover:underline"
          >
            <Gift className="h-4 w-4" />
            Create your first reward
          </button>
        </div>
      ) : null}

      <RewardForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        submitting={createMutation.isPending}
      />

      {markPaidRow ? (
        <MarkPaidDialog
          reward={markPaidRow}
          onClose={() => setMarkPaidRow(null)}
          submitting={markPaidMutation.isPending}
          onConfirm={async (input) => {
            await markPaidMutation.mutateAsync({
              id: markPaidRow.id,
              input,
            })
            success('Reward marked as paid.')
          }}
        />
      ) : null}
    </div>
  )
}
