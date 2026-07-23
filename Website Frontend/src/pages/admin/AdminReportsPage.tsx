import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'

import { listAdminApplications, listAdminPayments } from '@/api/admin.api'
import { AdminCard, AdminPageHeader } from '@/components/admin/AdminUI'

function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const escape = (value: unknown) => {
    const str = value == null ? '' : String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n')
}

export function AdminReportsPage() {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const runExport = async (
    kind: 'applications-csv' | 'payments-csv' | 'applications-xlsx' | 'pdf',
  ): Promise<void> => {
    setBusy(kind)
    setMessage(null)
    try {
      if (kind === 'applications-csv' || kind === 'applications-xlsx') {
        const data = await listAdminApplications({ page: 1, limit: 100 })
        const rows = data.items.map((item) => ({
          applicationNumber: item.applicationNumber,
          fullName: item.fullName,
          phone: item.phoneNumber ?? item.phone,
          district: item.district,
          taluka: item.taluka,
          status: item.status,
          paymentStatus: item.paymentStatus,
          submittedAt: item.submittedAt,
          createdAt: item.createdAt,
        }))
        downloadBlob(
          'gram-sahakari-applications.csv',
          toCsv(rows),
          'text/csv;charset=utf-8',
        )
        setMessage(
          kind === 'applications-xlsx'
            ? 'Excel-compatible CSV downloaded. Native XLSX export ships next.'
            : 'Applications CSV downloaded.',
        )
      } else if (kind === 'payments-csv') {
        const data = await listAdminPayments({ page: 1, limit: 100 })
        const rows = data.items.map((item) => ({
          applicationNumber: item.applicationNumber,
          fullName: item.fullName,
          amountInr: item.amountInr,
          paymentStatus: item.paymentStatus,
          razorpayOrderId: item.razorpayOrderId,
          razorpayPaymentId: item.razorpayPaymentId,
          paidAt: item.paidAt,
          updatedAt: item.updatedAt,
        }))
        downloadBlob(
          'gram-sahakari-payments.csv',
          toCsv(rows),
          'text/csv;charset=utf-8',
        )
        setMessage('Payments CSV downloaded.')
      } else {
        setMessage(
          'PDF report templates are prepared. Generation will attach branded PDF in the next release.',
        )
      }
    } catch {
      setMessage('Export failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const actions = [
    {
      id: 'applications-csv' as const,
      title: 'Export Applications (CSV)',
      description: 'Download the latest applications as CSV.',
      icon: Download,
    },
    {
      id: 'applications-xlsx' as const,
      title: 'Export Applications (Excel)',
      description: 'Excel-compatible spreadsheet export.',
      icon: FileSpreadsheet,
    },
    {
      id: 'payments-csv' as const,
      title: 'Export Payments (CSV)',
      description: 'Download payment ledger as CSV.',
      icon: Download,
    },
    {
      id: 'pdf' as const,
      title: 'Export PDF Report',
      description: 'Structured PDF summary (coming soon).',
      icon: FileText,
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Export operational data for finance and field teams."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <AdminCard key={action.id}>
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-forest-50 p-3 text-forest-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-ink">{action.title}</h2>
                  <p className="mt-1 text-sm text-steel">{action.description}</p>
                  <button
                    type="button"
                    disabled={busy === action.id}
                    onClick={() => void runExport(action.id)}
                    className="mt-4 rounded-xl bg-forest-900 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
                  >
                    {busy === action.id ? 'Working…' : 'Export'}
                  </button>
                </div>
              </div>
            </AdminCard>
          )
        })}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-steel" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
