import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { LoaderCircle } from 'lucide-react'

import { useAdminApplication, useAdminVolunteers } from '@/hooks/useAdmin'
import { getErrorMessage } from '@/lib/api-error'
import type { VolunteerListItem } from '@/types/admin.types'
import {
  REWARD_PAYMENT_METHODS,
  REWARD_PAYMENT_METHOD_LABELS,
  REWARD_REASONS,
  type CreateRewardInput,
  type RewardPaymentMethod,
  type RewardReason,
} from '@/types/reward.types'

const control =
  'w-full rounded-xl border border-mist px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500/30 disabled:cursor-not-allowed disabled:bg-mist/40 disabled:opacity-70'

const controlError =
  'w-full rounded-xl border border-red-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/30 disabled:cursor-not-allowed disabled:bg-mist/40 disabled:opacity-70'

type FieldErrors = {
  representative?: string
  amount?: string
  reason?: string
}

type Props = {
  open: boolean
  onClose: () => void
  /** Returns the created reward so the parent can navigate to its detail page. */
  onSubmit: (input: CreateRewardInput) => Promise<{ id: string }>
  submitting?: boolean
  presetApplicationId?: string
}

export function RewardForm({
  open,
  onClose,
  onSubmit,
  submitting = false,
  presetApplicationId,
}: Props) {
  const titleId = useId()
  const dialogRef = useRef<HTMLFormElement>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<VolunteerListItem | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<RewardReason | ''>('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] =
    useState<RewardPaymentMethod>('BANK_TRANSFER')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)

  const volunteerQuery = useMemo(
    () => ({ page: 1, limit: 20, search: search || undefined }),
    [search],
  )
  const { data: volunteers } = useAdminVolunteers(volunteerQuery)
  const { data: presetApp } = useAdminApplication(presetApplicationId ?? '')

  useEffect(() => {
    if (!open) return
    setError(null)
    setFieldErrors({})
    setTouched(false)
    if (!presetApplicationId) {
      setSelected(null)
      setSearch('')
    }
    setAmount('')
    setReason('')
    setDescription('')
    setPaymentMethod('BANK_TRANSFER')
    setNotes('')
  }, [open, presetApplicationId])

  useEffect(() => {
    if (!open || !presetApplicationId || !presetApp) return
    setSelected({
      id: presetApp.id,
      applicationNumber: presetApp.applicationNumber,
      volunteerId: presetApp.applicationNumber.startsWith('GS-MH-')
        ? presetApp.applicationNumber
        : presetApp.applicationNumber.replace(
            /^GS-(\d{4})-(\d+)$/i,
            'GS-MH-$1-$2',
          ),
      fullName: presetApp.fullName,
      phone: presetApp.phoneNumber ?? presetApp.phone,
      phoneNumber: presetApp.phoneNumber ?? presetApp.phone,
      district: presetApp.district,
      taluka: presetApp.taluka,
      village: presetApp.village,
      submittedAt: presetApp.submittedAt,
      photoUrl: presetApp.photo?.url ?? null,
    })
  }, [open, presetApplicationId, presetApp])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, submitting])

  const parsedAmount = amount === '' ? NaN : Number(amount)

  const validate = (): FieldErrors => {
    const next: FieldErrors = {}
    if (!selected) {
      next.representative = 'Please select a Village Representative.'
    }
    if (amount.trim() === '') {
      next.amount = 'Reward amount is required.'
    } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      next.amount = 'Reward amount must be greater than zero.'
    } else if (parsedAmount > 999_999) {
      next.amount = 'Reward amount cannot exceed ₹999,999.'
    }
    if (!reason) {
      next.reason = 'Please select a reason.'
    }
    return next
  }

  const errors = touched ? validate() : fieldErrors
  const isValid =
    Boolean(selected) &&
    amount.trim() !== '' &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= 999_999 &&
    Boolean(reason)

  if (!open) return null

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '')
    if (digits.length > 6) return
    setAmount(digits)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !selected || !reason) return
    if (submitting) return

    setError(null)
    try {
      await onSubmit({
        applicationId: selected.id,
        amount: parsedAmount,
        reason,
        description: description.trim() || null,
        paymentMethod,
        notes: notes.trim() || null,
      })
      // Parent navigates to Reward Detail; close only after success.
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create reward.'))
    }
  }

  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'TEXTAREA') return
    if (tag === 'BUTTON') return
    e.preventDefault()
    if (isValid && !submitting) {
      void handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close dialog"
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      {/*
        Form IS the dialog shell. max-height + overflow-hidden alone does not
        shrink flex children, so a nested footer was clipped (only Cancel
        remained visible). Scroll only the field list; keep the action bar
        outside the scroll region with flex-[1_1_0] on the middle pane.
      */}
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onKeyDown={onFormKeyDown}
        className="relative z-10 flex w-full max-w-[720px] flex-col overflow-hidden rounded-t-2xl border border-mist bg-white shadow-lift sm:rounded-2xl"
        style={{ maxHeight: 'min(90vh, calc(100dvh - 1rem))' }}
      >
        <div className="shrink-0 border-b border-mist px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            Create Reward
          </h2>
          <p className="mt-1 text-sm text-steel">
            This module records manual rewards only. Transfer the money
            separately using your bank, UPI, cash or cheque, then mark the
            reward as Paid to maintain payment history.
          </p>
        </div>

        <div className="min-h-0 flex-[1_1_0] space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Village Representative
              </label>
              {!selected ? (
                <>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or Volunteer ID…"
                    className={
                      errors.representative ? controlError : control
                    }
                    disabled={submitting}
                    autoComplete="off"
                  />
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-mist">
                    {(volunteers?.items ?? []).map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => {
                            setSelected(v)
                            setFieldErrors((prev) => ({
                              ...prev,
                              representative: undefined,
                            }))
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-forest-50/50 disabled:opacity-60"
                        >
                          {v.photoUrl ? (
                            <img
                              src={v.photoUrl}
                              alt=""
                              className="h-9 w-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-mist" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">
                              {v.fullName ?? '—'}
                            </p>
                            <p className="truncate text-xs text-steel">
                              {v.volunteerId} · {v.district ?? '—'}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                    {(volunteers?.items.length ?? 0) === 0 ? (
                      <li className="px-3 py-6 text-center text-xs text-steel">
                        No Village Representatives found
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : (
                <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-3 sm:p-4">
                  <div className="flex gap-3">
                    {selected.photoUrl ? (
                      <img
                        src={selected.photoUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-mist text-[10px] text-steel">
                        No photo
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-ink">
                          {selected.fullName ?? 'Village Representative'}
                        </p>
                        {!presetApplicationId ? (
                          <button
                            type="button"
                            disabled={submitting}
                            className="shrink-0 text-xs font-semibold text-steel hover:text-ink disabled:opacity-60"
                            onClick={() => setSelected(null)}
                          >
                            Change
                          </button>
                        ) : null}
                      </div>
                      <dl className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                        <div>
                          <dt className="text-steel">Volunteer ID</dt>
                          <dd className="font-mono text-ink">
                            {selected.volunteerId}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-steel">Application Number</dt>
                          <dd className="font-mono text-ink">
                            {selected.applicationNumber}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-steel">District</dt>
                          <dd className="text-ink">
                            {selected.district ?? '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-steel">Taluka</dt>
                          <dd className="text-ink">
                            {selected.taluka ?? '—'}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-steel">Village</dt>
                          <dd className="text-ink">
                            {selected.village ?? '—'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}
              {errors.representative ? (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.representative}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Reward Amount (₹)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter reward amount"
                className={errors.amount ? controlError : control}
                disabled={submitting}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.amount}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Reason
              </label>
              <select
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as RewardReason | '')
                }
                className={errors.reason ? controlError : control}
                disabled={submitting}
                aria-invalid={Boolean(errors.reason)}
              >
                <option value="">Select a reason</option>
                {REWARD_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.reason ? (
                <p className="mt-1.5 text-xs text-red-600">{errors.reason}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value.slice(0, 500))
                }
                rows={3}
                maxLength={500}
                className={control}
                disabled={submitting}
                placeholder="Explain why this Village Representative is receiving the reward."
              />
              <p className="mt-1 text-[11px] text-steel">
                {description.length}/500
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as RewardPaymentMethod)
                }
                className={control}
                disabled={submitting}
              >
                {REWARD_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {REWARD_PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-steel">
                This only records how the money will be transferred manually. No
                automatic payment is made by Kissan Agrisathi.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-steel">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={control}
                disabled={submitting}
                placeholder="Optional internal remarks."
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}
        </div>

        <div className="shrink-0 border-t border-mist bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-11 shrink-0 rounded-xl border border-mist px-4 py-2 text-sm font-medium text-ink hover:bg-mist/40 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-forest-800 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-900 disabled:cursor-not-allowed disabled:bg-forest-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  Creating...
                </>
              ) : (
                'Create Reward'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
