import { StatCard, formatInr } from '@/components/admin/AdminUI'
import type { RewardSummary } from '@/types/reward.types'

export function RewardSummaryCards({
  summary,
  loading,
}: {
  summary?: RewardSummary
  loading?: boolean
}) {
  const v = (n: number | undefined) => (loading || n === undefined ? '—' : n)
  const money = (n: number | undefined) =>
    loading || n === undefined ? '—' : formatInr(n)

  return (
    <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Rewards" value={v(summary?.totalRewards)} />
      <StatCard
        label="Pending Rewards"
        value={v(summary?.pendingRewards)}
        tone="amber"
      />
      <StatCard
        label="Total Amount Paid"
        value={money(summary?.totalAmountPaid)}
        tone="green"
      />
      <StatCard
        label="This Month"
        value={
          loading
            ? '—'
            : `${summary?.thisMonth ?? 0} · ${formatInr(summary?.thisMonthAmount ?? 0)}`
        }
      />
      <StatCard
        label="Average Reward"
        value={money(summary?.averageReward)}
        tone="blue"
      />
    </div>
  )
}
