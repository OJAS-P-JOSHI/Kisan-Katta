import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Loader2,
  Users,
  UsersRound,
} from 'lucide-react'
import { useState } from 'react'

import { AdminCard, AdminPageHeader } from '@/components/admin/AdminUI'
import { downloadAdminReportXlsx } from '@/lib/admin-report-download'
import { getErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

type Accent = 'featured' | 'strong' | 'default'

type ReportAction = {
  id: string
  title: string
  description: string
  badge: string
  downloadLabel: string
  icon: typeof Download
  accent: Accent
}

const FINANCE_REPORTS: ReportAction[] = [
  {
    id: 'revenue',
    title: 'Revenue Summary',
    description:
      'Gross, refunds, and net totals for Gram Sahakari fees and subscriptions.',
    badge: 'For CA / monthly review',
    downloadLabel: 'Download Revenue.xlsx',
    icon: IndianRupee,
    accent: 'featured',
  },
  {
    id: 'payments',
    title: 'Payments Ledger',
    description:
      'Full charge history with mobile, Razorpay IDs, status, and refunds.',
    badge: 'For audit & disputes',
    downloadLabel: 'Download Ledger.xlsx',
    icon: CreditCard,
    accent: 'featured',
  },
]

const OPS_REPORTS: ReportAction[] = [
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    description: 'Premium plans with mobile, customer ID, status, and period end.',
    badge: 'Roster',
    downloadLabel: 'Download Subscriptions.xlsx',
    icon: UsersRound,
    accent: 'strong',
  },
  {
    id: 'gram-sahakari',
    title: 'Gram Sahakari',
    description: 'Applications with payment status, amount, and Razorpay references.',
    badge: 'Applications',
    downloadLabel: 'Download Gram Sahakari.xlsx',
    icon: FileSpreadsheet,
    accent: 'default',
  },
  {
    id: 'users',
    title: 'Farmers',
    description: 'Farmer profiles with mobile number and location details.',
    badge: 'Directory',
    downloadLabel: 'Download Farmers.xlsx',
    icon: Users,
    accent: 'default',
  },
]

function formatDownloadTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function ReportCard({
  action,
  busy,
  progress,
  disabled,
  onDownload,
}: {
  action: ReportAction
  busy: boolean
  progress: number
  disabled: boolean
  onDownload: () => void
}) {
  const Icon = action.icon
  const featured = action.accent === 'featured'
  const strong = action.accent === 'strong'

  return (
    <AdminCard
      padded={false}
      className={cn(
        'transition-shadow duration-200',
        featured
          ? 'border-forest-200 shadow-soft ring-1 ring-forest-100/80 hover:shadow-md'
          : strong
            ? 'border-forest-100 hover:shadow-soft'
            : 'hover:shadow-soft',
      )}
    >
      <div className="flex h-full flex-col">
        <div
          className={cn(
            'flex items-start gap-3 px-4 py-3.5',
            featured && 'bg-forest-50/70',
            strong && 'bg-forest-50/35',
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              featured
                ? 'bg-forest-900 text-white'
                : strong
                  ? 'bg-forest-100 text-forest-900'
                  : 'bg-mist/70 text-forest-900',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold leading-snug text-ink">
                {action.title}
              </h3>
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                  featured || strong
                    ? 'bg-forest-100/80 text-forest-700'
                    : 'bg-mist/80 text-steel',
                )}
              >
                {action.badge}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-snug text-steel">
              {action.description}
            </p>
          </div>
        </div>

        <div className="border-t border-mist px-4 py-2.5">
          {busy ? (
            <div className="space-y-2" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-xs font-medium text-forest-900">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Preparing workbook…
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-mist">
                <div
                  className="h-full rounded-full bg-forest-700 transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, progress))}%` }}
                />
              </div>
              <p className="text-[11px] text-steel">
                Download starts automatically when ready.
              </p>
            </div>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={onDownload}
              className={cn(
                'inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                featured
                  ? 'bg-forest-900 text-white hover:bg-forest-700'
                  : strong
                    ? 'border border-forest-200 bg-white text-forest-900 hover:bg-forest-50'
                    : 'border border-mist bg-white text-ink hover:bg-mist/40',
              )}
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {action.downloadLabel}
            </button>
          )}
        </div>
      </div>
    </AdminCard>
  )
}

export function AdminReportsPage() {
  const [busy, setBusy] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{
    tone: 'ok' | 'error'
    text: string
  } | null>(null)

  const runExport = async (kind: string, title: string): Promise<void> => {
    setBusy(kind)
    setProgress(12)
    setMessage(null)

    let tick: ReturnType<typeof setInterval> | undefined
    tick = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) return prev
        return prev + Math.max(2, Math.round((90 - prev) * 0.12))
      })
    }, 180)

    try {
      await downloadAdminReportXlsx(kind)
      setProgress(100)
      const time = formatDownloadTime(new Date())
      setMessage({
        tone: 'ok',
        text: `${title} downloaded successfully • ${time}`,
      })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: getErrorMessage(error, 'Export failed. Please try again.'),
      })
    } finally {
      if (tick) clearInterval(tick)
      setBusy(null)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Reports"
        description="Export Excel workbooks for finance, your Chartered Accountant, and internal audit."
      />

      {message ? (
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm',
            message.tone === 'ok'
              ? 'border-forest-100 bg-forest-50 text-forest-900'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="status"
        >
          {message.tone === 'ok' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <p>{message.text}</p>
        </div>
      ) : null}

      <section className="space-y-2.5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Finance &amp; audit</h2>
          <p className="mt-0.5 text-xs text-steel">
            Start here for CA submissions and payment reconciliation.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FINANCE_REPORTS.map((action) => (
            <ReportCard
              key={action.id}
              action={action}
              busy={busy === action.id}
              progress={busy === action.id ? progress : 0}
              disabled={busy !== null}
              onDownload={() => void runExport(action.id, action.title)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Operations</h2>
          <p className="mt-0.5 text-xs text-steel">
            Rosters and applicant lists for day-to-day admin work.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {OPS_REPORTS.map((action) => (
            <ReportCard
              key={action.id}
              action={action}
              busy={busy === action.id}
              progress={busy === action.id ? progress : 0}
              disabled={busy !== null}
              onDownload={() => void runExport(action.id, action.title)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
