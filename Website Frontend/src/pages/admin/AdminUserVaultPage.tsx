import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
  cancelAdminSubscription,
  deactivatePremiumAdmin,
  getUserVault,
  grantFreeMonthAdmin,
  refundAdminSubscription,
  syncAdminSubscription,
} from '@/api/admin-ops.api'
import { DataTable, type Column } from '@/components/admin/DataTable'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
  StatCard,
} from '@/components/admin/AdminUI'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

type TabId =
  | 'overview'
  | 'profile'
  | 'subscription'
  | 'payments'
  | 'gram'
  | 'timeline'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'payments', label: 'Payments' },
  { id: 'gram', label: 'Gram Sahakari' },
  { id: 'timeline', label: 'Timeline' },
]

const ACTION_HELP = {
  sync: 'Pulls the latest status from Razorpay and updates our records. Use when the screen and Razorpay do not match. No money moves.',
  cancelAutopay:
    'Stops future auto-charges. Farmer keeps premium until the current period ends, then it lapses.',
  cancelNow:
    'Cancels the subscription on Razorpay immediately. Stops renewals now. Does not refund money.',
  refund:
    'Refunds the latest payment, cancels immediately, and revokes premium access. Reason is required. Use for mistaken charges or disputes.',
  freeMonth:
    'Extends premium access by about 30 days as goodwill or compensation. Does not charge the farmer.',
  deactivate:
    'Cuts premium access immediately in the app. Does not refund money. Use for abuse or to block access.',
} as const

function ActionWithHelp({
  help,
  children,
}: {
  help: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex items-center gap-0.5">
      {children}
      <button
        type="button"
        aria-label="What this action does"
        aria-expanded={open}
        title={help}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-full text-steel hover:bg-mist/70 hover:text-ink',
          open && 'bg-mist text-ink',
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-mist bg-white p-3 text-left text-xs leading-relaxed text-slate shadow-lift"
        >
          {help}
          <button
            type="button"
            className="mt-2 text-[11px] font-semibold text-forest-700 hover:underline"
            onClick={() => setOpen(false)}
          >
            Got it
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function AdminUserVaultPage() {
  const { userId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as TabId) || 'overview'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'vault', userId],
    queryFn: () => getUserVault(userId),
    enabled: Boolean(userId),
  })

  const [reason, setReason] = useState('')
  const [snack, setSnack] = useState<string | null>(null)

  const sub = data?.subscription as Record<string, unknown> | null | undefined
  const summary = data?.supportSummary as Record<string, unknown> | undefined
  const user = data?.user as Record<string, unknown> | undefined
  const profile = data?.profile as Record<string, unknown> | null | undefined

  const run = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => {
      setSnack('Action completed.')
      await qc.invalidateQueries({ queryKey: ['admin', 'vault', userId] })
      await refetch()
    },
    onError: (err) => setSnack(getErrorMessage(err, 'Action failed.')),
  })

  const confirmRun = (title: string, action: () => Promise<unknown>) => {
    if (!window.confirm(title)) return
    run.mutate(action)
  }

  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params)
    next.set('tab', id)
    setParams(next)
  }

  const paymentColumns: Column<Record<string, unknown>>[] = useMemo(
    () => [
      {
        key: 'paymentId',
        header: 'Payment ID',
        render: (row) => (
          <span className="font-mono text-xs">{String(row.paymentId)}</span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount',
        render: (row) => `₹${String(row.amountRupees ?? '—')}`,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => String(row.status),
      },
      {
        key: 'paidAt',
        header: 'Paid',
        render: (row) => formatDateTime(String(row.paidAt)),
      },
    ],
    [],
  )

  if (isLoading) {
    return <p className="text-sm text-steel">Loading user vault…</p>
  }
  if (error || !data) {
    return (
      <AdminCard>
        <p className="text-sm text-red-700">
          {getErrorMessage(error, 'User not found.')}
        </p>
      </AdminCard>
    )
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={String(profile?.name ?? user?.mobile ?? 'User Vault')}
        description={`${String(user?.mobile ?? '')} · ${String(user?.role ?? '')}`}
        actions={
          <Button variant="outline" onClick={() => navigate('/admin/farmers')}>
            Back to farmers
          </Button>
        }
      />

      {snack ? (
        <div className="rounded-xl border border-mist bg-white px-4 py-2 text-sm">
          {snack}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Premium"
          value={summary?.isPremiumActive ? 'Active' : 'Inactive'}
          tone={summary?.isPremiumActive ? 'green' : 'amber'}
        />
        <StatCard
          label="Subscription"
          value={String(summary?.subscriptionStatus ?? '—')}
        />
        <StatCard
          label="GS Status"
          value={String(summary?.gsStatus ?? '—')}
        />
        <StatCard
          label="Active listings"
          value={Number(summary?.activeListings ?? 0)}
        />
      </div>

      <AdminCard title="Action reason">
        <Input
          placeholder="Reason for refund / cancel / deactivate"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </AdminCard>

      <div className="flex flex-wrap gap-2">
        <ActionWithHelp help={ACTION_HELP.sync}>
          <Button
            size="sm"
            variant="outline"
            disabled={!sub?.id || run.isPending}
            onClick={() =>
              confirmRun('Sync subscription from Razorpay?', () =>
                syncAdminSubscription(String(sub!.id), reason || 'support_sync'),
              )
            }
          >
            Sync
          </Button>
        </ActionWithHelp>
        <ActionWithHelp help={ACTION_HELP.cancelAutopay}>
          <Button
            size="sm"
            variant="outline"
            disabled={!userId || run.isPending}
            onClick={() =>
              confirmRun('Cancel AutoPay (keep period access)?', () =>
                cancelAdminSubscription(
                  userId,
                  true,
                  reason || 'support_cancel_autopay',
                ),
              )
            }
          >
            Cancel AutoPay
          </Button>
        </ActionWithHelp>
        <ActionWithHelp help={ACTION_HELP.cancelNow}>
          <Button
            size="sm"
            variant="outline"
            disabled={!userId || run.isPending}
            onClick={() =>
              confirmRun('Cancel subscription immediately?', () =>
                cancelAdminSubscription(
                  userId,
                  false,
                  reason || 'support_cancel_now',
                ),
              )
            }
          >
            Cancel Now
          </Button>
        </ActionWithHelp>
        <ActionWithHelp help={ACTION_HELP.refund}>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 text-red-700"
            disabled={!userId || run.isPending || !reason.trim()}
            onClick={() =>
              confirmRun(
                'Refund latest payment, cancel, and revoke premium?',
                () =>
                  refundAdminSubscription(userId, {
                    reason: reason.trim(),
                  }),
              )
            }
          >
            Refund
          </Button>
        </ActionWithHelp>
        <ActionWithHelp help={ACTION_HELP.freeMonth}>
          <Button
            size="sm"
            variant="outline"
            disabled={!sub?.id || run.isPending}
            onClick={() =>
              confirmRun('Grant one free month of access?', () =>
                grantFreeMonthAdmin(String(sub!.id), reason || 'free_month'),
              )
            }
          >
            Free Month
          </Button>
        </ActionWithHelp>
        <ActionWithHelp help={ACTION_HELP.deactivate}>
          <Button
            size="sm"
            variant="outline"
            disabled={!sub?.id || run.isPending}
            onClick={() =>
              confirmRun('Deactivate premium access now?', () =>
                deactivatePremiumAdmin(String(sub!.id), reason || 'deactivate'),
              )
            }
          >
            Deactivate
          </Button>
        </ActionWithHelp>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-mist bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${
              tab === t.id
                ? 'bg-forest-800 text-white'
                : 'text-slate hover:bg-mist/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <AdminCard title="Support summary">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-steel">User ID</dt>
              <dd className="font-mono text-xs">{String(user?.id)}</dd>
            </div>
            <div>
              <dt className="text-steel">Verified</dt>
              <dd>{user?.isVerified ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-steel">Last login</dt>
              <dd>{formatDateTime(user?.lastLoginAt as string | null)}</dd>
            </div>
            <div>
              <dt className="text-steel">Latest payment</dt>
              <dd className="font-mono text-xs">
                {String(summary?.latestPaymentId ?? '—')}
              </dd>
            </div>
          </dl>
        </AdminCard>
      )}

      {tab === 'profile' && (
        <AdminCard title="Profile">
          {profile ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-steel">Name</dt>
                <dd>{String(profile.name)}</dd>
              </div>
              <div>
                <dt className="text-steel">Location</dt>
                <dd>
                  {String(profile.village)}, {String(profile.taluka)},{' '}
                  {String(profile.district)}
                </dd>
              </div>
              <div>
                <dt className="text-steel">Language</dt>
                <dd>{String(profile.language)}</dd>
              </div>
              <div>
                <dt className="text-steel">Crops</dt>
                <dd>{(profile.favoriteCrops as string[])?.join(', ')}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-steel">No profile yet.</p>
          )}
        </AdminCard>
      )}

      {tab === 'subscription' && (
        <AdminCard title="Current subscription">
          {sub ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-steel">Status</dt>
                <dd>{String(sub.status)}</dd>
              </div>
              <div>
                <dt className="text-steel">Active</dt>
                <dd>{sub.isActive ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="text-steel">Subscription ID</dt>
                <dd className="font-mono text-xs">{String(sub.subscriptionId)}</dd>
              </div>
              <div>
                <dt className="text-steel">Customer ID</dt>
                <dd className="font-mono text-xs">{String(sub.customerId)}</dd>
              </div>
              <div>
                <dt className="text-steel">Period</dt>
                <dd>
                  {formatDateTime(sub.currentPeriodStart as string | null)} →{' '}
                  {formatDateTime(sub.currentPeriodEnd as string | null)}
                </dd>
              </div>
              <div>
                <dt className="text-steel">Next charge</dt>
                <dd>{formatDateTime(sub.nextChargeAt as string | null)}</dd>
              </div>
              <div>
                <dt className="text-steel">Access revoked</dt>
                <dd>{formatDateTime(sub.accessRevokedAt as string | null)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-steel">No subscription.</p>
          )}
        </AdminCard>
      )}

      {tab === 'payments' && (
        <AdminCard title="Billing history" padded={false}>
          <DataTable
            columns={paymentColumns}
            rows={(data.paymentHistory as Array<Record<string, unknown>>) ?? []}
            rowKey={(row) =>
              String(row.paymentId ?? `${String(row.paidAt)}-${String(row.status)}`)
            }
            emptyTitle="No billing payments"
          />
        </AdminCard>
      )}

      {tab === 'gram' && (
        <AdminCard title="Gram Sahakari">
          {((data.gramSahakari as Array<Record<string, unknown>>) ?? []).map((a) => (
            <Link
              key={String(a.id)}
              to={`/admin/gram-sahakari/${a.id}`}
              className="mb-2 block rounded-xl border border-mist px-3 py-2 text-sm hover:bg-mist/40"
            >
              {String(a.applicationNumber)} · {String(a.status)} /{' '}
              {String(a.paymentStatus)}
            </Link>
          ))}
          {!((data.gramSahakari as unknown[]) ?? []).length && (
            <p className="text-sm text-steel">No applications.</p>
          )}
        </AdminCard>
      )}

      {tab === 'timeline' && (
        <AdminCard title="Timeline">
          {((data.timeline as Array<Record<string, unknown>>) ?? []).map((e, idx) => (
            <div key={idx} className="mb-2 border-b border-mist pb-2 text-sm last:border-0">
              <p className="font-medium">
                {String(e.source)} · {String(e.type)}
              </p>
              <p className="text-xs text-steel">{formatDateTime(String(e.at))}</p>
            </div>
          ))}
          {!((data.timeline as unknown[]) ?? []).length && (
            <p className="text-sm text-steel">No events yet.</p>
          )}
        </AdminCard>
      )}
    </div>
  )
}
