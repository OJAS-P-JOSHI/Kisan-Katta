import { ArrowLeft, CheckCircle2, LoaderCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

import {
  AdminCard,
  AdminPageHeader,
  TableSkeleton,
  formatDate,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { RewardStatusBadge } from '@/components/admin/rewards/RewardStatusBadge'
import { RewardTimeline } from '@/components/admin/rewards/RewardTimeline'
import { useToast } from '@/components/common/Toast'
import { useAdminMe } from '@/hooks/useAdmin'
import {
  useCancelReward,
  useMarkRewardPaid,
  useReward,
} from '@/hooks/useRewards'
import { getErrorMessage } from '@/lib/api-error'
import { REWARD_PAYMENT_METHOD_LABELS } from '@/types/reward.types'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-steel">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{value?.trim() || '—'}</dd>
    </div>
  )
}

function MarkPaidDialog({
  rewardId,
  amount,
  name,
  open,
  onClose,
  onDone,
}: {
  rewardId: string
  amount: number
  name: string
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const { success, error: toastError } = useToast()
  const markPaid = useMarkRewardPaid()
  const [txn, setTxn] = useState('')
  const [paidDate, setPaidDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTxn('')
    setPaidDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !markPaid.isPending) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, markPaid.isPending, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        disabled={markPaid.isPending}
        onClick={() => {
          if (!markPaid.isPending) onClose()
        }}
      />
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-mist bg-white shadow-lift sm:rounded-2xl">
        <div className="border-b border-mist px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">Mark as Paid</h2>
          <p className="mt-1 text-sm text-steel">
            Confirm transfer of <strong>{formatInr(amount)}</strong> to {name}{' '}
            outside this system. No money is sent from Kisan Katta.
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
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
              placeholder="UTR / UPI ref / cheque no."
              disabled={markPaid.isPending}
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
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
              disabled={markPaid.isPending}
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
              className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
              placeholder="Optional internal remarks."
              disabled={markPaid.isPending}
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex flex-row items-center justify-between gap-3 border-t border-mist px-5 py-4">
          <button
            type="button"
            disabled={markPaid.isPending}
            onClick={onClose}
            className="min-h-11 rounded-xl border border-mist px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={markPaid.isPending || !paidDate}
            onClick={async () => {
              try {
                setError(null)
                await markPaid.mutateAsync({
                  id: rewardId,
                  input: {
                    transactionReference: txn.trim() || null,
                    paidDate,
                    notes: notes.trim() || null,
                  },
                })
                success('Reward marked as paid.')
                onClose()
                onDone()
              } catch (err) {
                const msg = getErrorMessage(err, 'Unable to mark as paid.')
                setError(msg)
                toastError(msg)
              }
            }}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {markPaid.isPending ? (
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

export function AdminRewardDetailPage() {
  const { id = '' } = useParams()
  const { data: admin } = useAdminMe()
  const { success, error: toastError } = useToast()
  const canManage = admin?.role === 'SUPER_ADMIN'
  const { data, isLoading, isError, refetch } = useReward(id)
  const cancel = useCancelReward()
  const [payOpen, setPayOpen] = useState(false)

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Reward details" />
        <AdminCard>
          <TableSkeleton rows={8} />
        </AdminCard>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <AdminPageHeader title="Reward details" />
        <AdminCard>
          <p className="text-sm text-red-600">Reward not found.</p>
          <Link
            to="/admin/rewards"
            className="mt-3 inline-flex items-center gap-2 text-sm text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to rewards
          </Link>
        </AdminCard>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title={data.rewardId}
        description="Review this reward, then record the manual payout when complete."
        actions={
          <Link
            to="/admin/rewards"
            className="inline-flex items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm font-medium text-ink hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <p className="mb-5 text-xs font-medium uppercase tracking-wide text-steel">
        Create Reward → Reward Details → Mark as Paid → Completed
      </p>

      <AdminCard className="mb-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt={data.villageRepresentativeName}
              className="h-28 w-28 shrink-0 rounded-2xl object-cover shadow-soft"
            />
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-mist text-xs text-steel">
              No photo
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-ink">
                {data.villageRepresentativeName}
              </h2>
              <RewardStatusBadge status={data.status} />
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Volunteer ID" value={data.volunteerId} />
              <Field label="District" value={data.district} />
              <Field label="Taluka" value={data.taluka} />
              <Field label="Village" value={data.village} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-steel">
                  Application
                </dt>
                <dd className="mt-1">
                  <Link
                    to={`/admin/applications/${data.applicationId}`}
                    className="text-sm font-medium text-forest-800 hover:underline"
                  >
                    Open Village Representative profile
                  </Link>
                </dd>
              </div>
              <Field label="Reward amount" value={formatInr(data.amount)} />
              <Field label="Reason" value={data.reason} />
              <Field
                label="Payment method"
                value={REWARD_PAYMENT_METHOD_LABELS[data.paymentMethod]}
              />
            </dl>
          </div>
        </div>
      </AdminCard>

      {canManage && data.status === 'PENDING' ? (
        <AdminCard className="mb-6 border-forest-100 bg-forest-50/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-forest-900">
                Next step: record the manual payout
              </p>
              <p className="mt-1 text-sm text-steel">
                Transfer {formatInr(data.amount)} outside this system (bank,
                UPI, cash, or cheque), then mark this reward as paid to keep
                history complete.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPayOpen(true)}
              className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-forest-800 px-8 py-3 text-base font-semibold text-white hover:bg-forest-900 sm:w-auto"
            >
              Mark as Paid
            </button>
          </div>
        </AdminCard>
      ) : null}

      {data.status === 'PAID' ? (
        <AdminCard className="mb-6 border-forest-100 bg-forest-50/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" />
            <div>
              <p className="text-sm font-semibold text-forest-900">
                Payout recorded
              </p>
              <p className="mt-1 text-sm text-steel">
                This reward is marked as Paid
                {data.paidDate ? ` on ${formatDate(data.paidDate)}` : ''}.
                {data.transactionReference
                  ? ` Reference: ${data.transactionReference}.`
                  : ''}
              </p>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title="Reward details">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Description" value={data.description} />
              <Field label="Notes" value={data.notes} />
              <Field
                label="Transaction reference"
                value={data.transactionReference}
              />
              <Field
                label="Paid date"
                value={data.paidDate ? formatDate(data.paidDate) : null}
              />
              <Field label="Created by" value={data.createdBy} />
              <Field label="Approved by" value={data.approvedBy} />
              <Field label="Created" value={formatDateTime(data.createdAt)} />
              <Field label="Updated" value={formatDateTime(data.updatedAt)} />
            </dl>
          </AdminCard>

          {canManage && data.status === 'PENDING' ? (
            <AdminCard title="Other actions">
              <button
                type="button"
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Cancel reward ${data.rewardId}? This cannot be undone.`,
                    )
                  ) {
                    return
                  }
                  try {
                    await cancel.mutateAsync({ id: data.id })
                    success('Reward cancelled.')
                    void refetch()
                  } catch (err) {
                    toastError(
                      getErrorMessage(err, 'Unable to cancel reward.'),
                    )
                  }
                }}
                className="min-h-11 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700"
              >
                Cancel Reward
              </button>
            </AdminCard>
          ) : null}
        </div>

        <div className="space-y-6">
          <AdminCard title="Timeline">
            <RewardTimeline timeline={data.timeline} />
          </AdminCard>
        </div>
      </div>

      <MarkPaidDialog
        rewardId={data.id}
        amount={data.amount}
        name={data.villageRepresentativeName}
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onDone={() => void refetch()}
      />
    </div>
  )
}
