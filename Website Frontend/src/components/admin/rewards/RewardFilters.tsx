import type {
  RewardListQuery,
  RewardPaymentMethod,
  RewardStatus,
} from '@/types/reward.types'
import {
  REWARD_PAYMENT_METHODS,
  REWARD_PAYMENT_METHOD_LABELS,
  REWARD_STATUSES,
} from '@/types/reward.types'

const control =
  'rounded-xl border border-mist px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500/30'

type Props = {
  value: RewardListQuery
  onChange: (next: RewardListQuery) => void
}

export function RewardFilters({ value, onChange }: Props) {
  const set = <K extends keyof RewardListQuery>(
    key: K,
    v: RewardListQuery[K],
  ) => onChange({ ...value, [key]: v, page: 1 })

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <input
        value={value.search ?? ''}
        onChange={(e) => set('search', e.target.value)}
        placeholder="Search name, Volunteer ID, district, reason…"
        className={`${control} sm:col-span-2 xl:col-span-2`}
        aria-label="Search rewards"
      />
      <input
        value={value.villageRepresentativeName ?? ''}
        onChange={(e) => set('villageRepresentativeName', e.target.value)}
        placeholder="Village Representative name"
        className={control}
      />
      <input
        value={value.volunteerId ?? ''}
        onChange={(e) => set('volunteerId', e.target.value)}
        placeholder="Volunteer ID"
        className={control}
      />
      <input
        value={value.district ?? ''}
        onChange={(e) => set('district', e.target.value)}
        placeholder="District"
        className={control}
      />
      <select
        value={value.status ?? ''}
        onChange={(e) =>
          set(
            'status',
            (e.target.value || undefined) as RewardStatus | undefined,
          )
        }
        className={control}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {REWARD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={value.paymentMethod ?? ''}
        onChange={(e) =>
          set(
            'paymentMethod',
            (e.target.value || undefined) as RewardPaymentMethod | undefined,
          )
        }
        className={control}
        aria-label="Filter by payment method"
      >
        <option value="">All payment methods</option>
        {REWARD_PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {REWARD_PAYMENT_METHOD_LABELS[m]}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={value.fromDate ?? ''}
        onChange={(e) => set('fromDate', e.target.value || undefined)}
        className={control}
        aria-label="From date"
      />
      <input
        type="date"
        value={value.toDate ?? ''}
        onChange={(e) => set('toDate', e.target.value || undefined)}
        className={control}
        aria-label="To date"
      />
      <input
        type="number"
        min={0}
        value={value.minAmount ?? ''}
        onChange={(e) =>
          set(
            'minAmount',
            e.target.value === '' ? undefined : Number(e.target.value),
          )
        }
        placeholder="Min amount"
        className={control}
      />
      <input
        type="number"
        min={0}
        value={value.maxAmount ?? ''}
        onChange={(e) =>
          set(
            'maxAmount',
            e.target.value === '' ? undefined : Number(e.target.value),
          )
        }
        placeholder="Max amount"
        className={control}
      />
    </div>
  )
}
