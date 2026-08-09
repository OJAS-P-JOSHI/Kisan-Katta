import { useQuery } from '@tanstack/react-query'
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  Download,
  Loader2,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listPaymentCenter } from '@/api/admin-ops.api'
import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import { filterControlClass } from '@/components/admin/FilterPanel'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
  formatInr,
} from '@/components/admin/AdminUI'
import { downloadAdminReportXlsx } from '@/lib/admin-report-download'
import { getErrorMessage } from '@/lib/api-error'
import { cn } from '@/lib/utils'

const ID_PREVIEW_LEN = 5

function TruncatedCopyId({ value }: { value: unknown }) {
  const full =
    typeof value === 'string' && value.trim()
      ? value.trim()
      : value != null && value !== ''
        ? String(value)
        : null
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!full) return
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore — clipboard may be unavailable */
    }
  }, [full])

  if (!full) return <span>—</span>

  const preview =
    full.length <= ID_PREVIEW_LEN ? full : `${full.slice(0, ID_PREVIEW_LEN)}…`

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-xs" title={full}>
        {preview}
      </span>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate transition hover:bg-mist/60 hover:text-forest-900"
        aria-label={copied ? 'Copied' : 'Copy full ID'}
        title={copied ? 'Copied' : 'Copy full ID'}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-forest-700" aria-hidden />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
    </span>
  )
}

function formatPaymentSource(source: unknown): string {
  const value = String(source ?? '')
  if (value === 'SUBSCRIPTION') return 'sub'
  return value
}

export function AdminPaymentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [source, setSource] = useState<'ALL' | 'GS' | 'SUBSCRIPTION'>('ALL')
  const [status, setStatus] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<{
    tone: 'ok' | 'error'
    text: string
  } | null>(null)

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      source,
      status: status || undefined,
    }),
    [page, search, source, status],
  )

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin', 'payments-center', query],
    queryFn: () => listPaymentCenter(query),
    placeholderData: (prev) => prev,
  })

  const handleDownloadExcel = async () => {
    setExporting(true)
    setExportMessage(null)
    try {
      const filename = await downloadAdminReportXlsx('payments')
      setExportMessage({
        tone: 'ok',
        text: `Downloaded ${filename}`,
      })
    } catch (err) {
      setExportMessage({
        tone: 'error',
        text: getErrorMessage(err, 'Export failed. Please try again.'),
      })
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (row) => formatPaymentSource(row.source),
    },
    {
      key: 'paymentId',
      header: 'Payment ID',
      render: (row) => <TruncatedCopyId value={row.paymentId} />,
    },
    {
      key: 'orderId',
      header: 'Order / Sub',
      hideOnMobile: true,
      render: (row) => (
        <TruncatedCopyId value={row.orderId ?? row.subscriptionId} />
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) =>
        formatInr(
          typeof row.amountPaise === 'number' ? row.amountPaise / 100 : 0,
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => String(row.status),
    },
    {
      key: 'refundId',
      header: 'Refund ID',
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-xs">{String(row.refundId ?? '—')}</span>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (row) => {
        const mobile =
          typeof row.mobile === 'string' && row.mobile.trim()
            ? row.mobile.trim()
            : null
        if (!row.userId && !mobile) return '—'
        if (!row.userId) return mobile
        return (
          <Link
            to={`/admin/users/${String(row.userId)}?tab=payments`}
            className="font-mono text-sm text-forest-800 hover:underline"
            title="Open farmer vault"
          >
            {mobile ?? '—'}
          </Link>
        )
      },
    },
    {
      key: 'related',
      header: 'Related',
      render: (row) =>
        row.applicationId ? (
          <Link
            to={`/admin/gram-sahakari/${String(row.applicationId)}`}
            className="text-forest-800 hover:underline"
          >
            {String(row.applicationNumber)}
          </Link>
        ) : row.userId ? (
          <Link
            to={`/admin/users/${String(row.userId)}?tab=subscription`}
            className="text-forest-800 hover:underline"
          >
            Subscription
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row) => formatDateTime(String(row.updatedAt)),
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Payment Center"
        description="Gram Sahakari fees and subscription billing in one place."
        actions={
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleDownloadExcel()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-forest-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" aria-hidden />
            )}
            {exporting ? 'Preparing…' : 'Download Excel'}
          </button>
        }
      />

      {exportMessage ? (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
            exportMessage.tone === 'ok'
              ? 'border-forest-100 bg-forest-50 text-forest-900'
              : 'border-red-200 bg-red-50 text-red-800',
          )}
          role="status"
        >
          {exportMessage.tone === 'ok' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <p>{exportMessage.text}</p>
        </div>
      ) : null}

      <AdminCard padded={false}>
        <div className="space-y-3 p-4 sm:p-5">
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Payment ID, order ID, subscription ID, application number…"
            className={filterControlClass}
          />
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'GS', 'SUBSCRIPTION'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSource(s)
                  setPage(1)
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  source === s
                    ? 'bg-forest-800 text-white'
                    : 'border border-mist text-slate'
                }`}
              >
                {s}
              </button>
            ))}
            <select
              className={filterControlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              {['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED'].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {error ? (
          <p className="px-4 pb-4 text-sm text-red-700">
            {getErrorMessage(error, 'Failed to load payments.')}
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={(data?.items as Array<Record<string, unknown>>) ?? []}
              loading={isLoading || isFetching}
              rowKey={(row) =>
                String(
                  row.paymentId ??
                    `${String(row.source)}-${String(row.userId)}-${String(row.updatedAt)}`,
                )
              }
              emptyTitle="No payments found"
            />
            <div className="px-4 pb-4">
              <Pagination
                page={data?.page ?? page}
                totalPages={data?.totalPages ?? 0}
                total={data?.total ?? 0}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </AdminCard>
    </div>
  )
}
