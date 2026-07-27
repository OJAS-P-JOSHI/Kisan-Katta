import { ArrowLeft, ExternalLink, Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'

import { GramSahakariIDCard } from '@/components/id-card'
import {
  AdminCard,
  AdminPageHeader,
  TableSkeleton,
  formatDate,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { RewardForm } from '@/components/admin/rewards/RewardForm'
import { RewardStatusBadge } from '@/components/admin/rewards/RewardStatusBadge'
import { StatusBadge } from '@/components/application/StatusBadge'
import { useToast } from '@/components/common/Toast'
import { useAdminApplication, useAdminMe } from '@/hooks/useAdmin'
import {
  useCreateReward,
  useRepresentativeRewards,
} from '@/hooks/useRewards'
import { isIDCardEligible } from '@/lib/gram-sahakari-id'
import type { CreateRewardInput } from '@/types/reward.types'

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

function DocLink({
  label,
  url,
}: {
  label: string
  url?: string | null
}) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-mist px-4 py-6 text-center text-xs text-steel">
        {label}: not uploaded
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between rounded-xl border border-mist px-4 py-3 text-sm hover:border-forest-100 hover:bg-forest-50/40"
    >
      <span className="font-medium text-ink">{label}</span>
      <ExternalLink className="h-4 w-4 text-steel group-hover:text-forest-700" />
    </a>
  )
}

export function AdminApplicationDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError } = useAdminApplication(id)
  const { data: admin } = useAdminMe()
  const { success } = useToast()
  const canManageRewards = admin?.role === 'SUPER_ADMIN'
  const [tab, setTab] = useState<'overview' | 'rewards'>('overview')
  const [createOpen, setCreateOpen] = useState(false)
  const { data: rewards, isLoading: rewardsLoading } =
    useRepresentativeRewards(id)
  const createReward = useCreateReward()

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Application details" />
        <AdminCard>
          <TableSkeleton rows={8} />
        </AdminCard>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <AdminPageHeader title="Application details" />
        <AdminCard>
          <p className="text-sm text-red-600">Application not found.</p>
          <Link
            to="/admin/applications"
            className="mt-3 inline-flex items-center gap-2 text-sm text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to applications
          </Link>
        </AdminCard>
      </div>
    )
  }

  const showId = isIDCardEligible(data)

  const handleCreate = async (input: CreateRewardInput) => {
    const created = await createReward.mutateAsync(input)
    success('Reward created successfully.')
    setCreateOpen(false)
    navigate(`/admin/rewards/${created.id}`)
    return { id: created.id }
  }

  return (
    <div>
      <AdminPageHeader
        title={data.applicationNumber}
        description={data.fullName ?? 'Village Representative application'}
        actions={
          <Link
            to="/admin/applications"
            className="inline-flex items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm font-medium text-ink hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge kind="application" status={data.status} />
        <span className="rounded-full border border-mist px-3 py-1 text-xs font-medium text-steel">
          Payment: {data.paymentStatus}
        </span>
      </div>

      <div
        className="mb-5 flex gap-1 rounded-xl border border-mist bg-white p-1 shadow-soft"
        role="tablist"
        aria-label="Village Representative sections"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          onClick={() => setTab('overview')}
          className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'overview'
              ? 'bg-forest-50 text-forest-900'
              : 'text-steel hover:text-ink'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'rewards'}
          onClick={() => setTab('rewards')}
          className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            tab === 'rewards'
              ? 'bg-forest-50 text-forest-900'
              : 'text-steel hover:text-ink'
          }`}
        >
          Rewards
        </button>
      </div>

      {tab === 'rewards' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-3">
            <AdminCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-steel">
                Lifetime Rewards
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-ink">
                {rewardsLoading
                  ? '—'
                  : `${rewards?.lifetimeRewards ?? 0} · ${formatInr(rewards?.lifetimeAmount ?? 0)}`}
              </p>
            </AdminCard>
            <AdminCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-steel">
                Pending
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-amber-800">
                {rewardsLoading
                  ? '—'
                  : `${rewards?.pending ?? 0} · ${formatInr(rewards?.pendingAmount ?? 0)}`}
              </p>
            </AdminCard>
            <AdminCard>
              <p className="text-[11px] font-medium uppercase tracking-wide text-steel">
                Paid
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums text-forest-800">
                {rewardsLoading
                  ? '—'
                  : `${rewards?.paid ?? 0} · ${formatInr(rewards?.paidAmount ?? 0)}`}
              </p>
            </AdminCard>
          </div>

          <AdminCard
            title="Reward History"
            action={
              canManageRewards &&
              data.status === 'SUBMITTED' &&
              data.paymentStatus === 'PAID' ? (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Reward
                </button>
              ) : null
            }
            padded={false}
          >
            {rewardsLoading ? (
              <div className="p-4">
                <TableSkeleton rows={4} />
              </div>
            ) : (rewards?.items.length ?? 0) === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-steel">
                No rewards recorded for this Village Representative.
              </p>
            ) : (
              <ul className="divide-y divide-mist">
                {rewards?.items.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/admin/rewards/${r.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 hover:bg-forest-50/40 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-forest-800">
                          {r.rewardId}
                        </p>
                        <p className="truncate text-sm text-ink">{r.reason}</p>
                        <p className="text-xs text-steel">
                          {formatDate(r.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatInr(r.amount)}
                        </span>
                        <RewardStatusBadge status={r.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <RewardForm
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreate}
            submitting={createReward.isPending}
            presetApplicationId={id}
          />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <AdminCard title="Applicant">
              <div className="flex flex-col gap-6 sm:flex-row">
                {data.photo?.url ? (
                  <img
                    src={data.photo.url}
                    alt={data.fullName ?? 'Applicant'}
                    className="h-28 w-28 rounded-2xl object-cover shadow-soft"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-mist text-xs text-steel">
                    No photo
                  </div>
                )}
                <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={data.fullName} />
                  <Field
                    label="Phone"
                    value={data.phoneNumber ?? data.phone}
                  />
                  <Field label="Email" value={data.email} />
                  <Field label="Gender" value={data.gender} />
                  <Field
                    label="Date of birth"
                    value={
                      data.dob ? formatDateTime(data.dob).split(',')[0] : null
                    }
                  />
                  <Field label="Aadhaar" value={data.aadhaarNumber} />
                </dl>
              </div>
            </AdminCard>

            <AdminCard title="Address">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Address" value={data.address} />
                <Field label="Village" value={data.village} />
                <Field label="Taluka" value={data.taluka} />
                <Field label="District" value={data.district} />
                <Field label="PIN" value={data.pincode} />
              </dl>
            </AdminCard>

            <AdminCard title="Bank">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Account holder" value={data.bankAccountHolder} />
                <Field label="Account number" value={data.bankAccountNumber} />
                <Field label="IFSC" value={data.bankIFSC} />
                <Field label="Bank name" value={data.bankName} />
              </dl>
            </AdminCard>

            <AdminCard title="Documents">
              <div className="grid gap-3 sm:grid-cols-2">
                <DocLink label="Photo" url={data.photo?.url} />
                <DocLink label="Aadhaar front" url={data.aadhaarFront?.url} />
                <DocLink label="Aadhaar back" url={data.aadhaarBack?.url} />
                <DocLink
                  label="Cancelled cheque"
                  url={data.cancelledChequeImage?.url}
                />
              </div>
            </AdminCard>
          </div>

          <div className="space-y-6">
            <AdminCard title="Payment">
              <dl className="grid gap-4">
                <Field label="Status" value={data.paymentStatus} />
                <Field label="Reference" value={data.paymentReference} />
                <Field
                  label="Submitted"
                  value={formatDateTime(data.submittedAt)}
                />
                <Field label="Created" value={formatDateTime(data.createdAt)} />
                <Field label="Updated" value={formatDateTime(data.updatedAt)} />
              </dl>
            </AdminCard>

            <AdminCard title="Timeline">
              <ol className="relative space-y-4 border-l border-mist pl-4">
                <li>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-forest-500" />
                  <p className="text-sm font-medium text-ink">
                    Application created
                  </p>
                  <p className="text-xs text-steel">
                    {formatDateTime(data.createdAt)}
                  </p>
                </li>
                {data.status !== 'DRAFT' ? (
                  <li>
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-amber-500" />
                    <p className="text-sm font-medium text-ink">
                      Payment pending
                    </p>
                    <p className="text-xs text-steel">Moved to payment flow</p>
                  </li>
                ) : null}
                {data.status === 'SUBMITTED' ? (
                  <li>
                    <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-forest-700" />
                    <p className="text-sm font-medium text-ink">Submitted</p>
                    <p className="text-xs text-steel">
                      {formatDateTime(data.submittedAt)}
                    </p>
                  </li>
                ) : null}
              </ol>
            </AdminCard>

            {showId ? (
              <AdminCard title="ID Card">
                <div className="overflow-hidden rounded-xl">
                  <GramSahakariIDCard application={data} showHeading={false} />
                </div>
              </AdminCard>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
