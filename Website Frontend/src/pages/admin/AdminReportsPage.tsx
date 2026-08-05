import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'

import { listAdminApplications, listAdminPayments } from '@/api/admin.api'
import { api } from '@/api/axios'
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

  const downloadServerReport = async (type: string): Promise<void> => {
    const response = await api.get(`/api/v1/admin/reports/export/${type}`, {
      responseType: 'text',
    })
    downloadBlob(
      `${type}-export.csv`,
      String(response.data),
      'text/csv;charset=utf-8',
    )
  }

  const runExport = async (kind: string): Promise<void> => {
    setBusy(kind)
    setMessage(null)
    try {
      if (
        [
          'users',
          'subscriptions',
          'gram-sahakari',
          'revenue',
        ].includes(kind)
      ) {
        await downloadServerReport(kind)
        setMessage(`${kind} CSV downloaded.`)
      } else if (kind === 'applications-csv' || kind === 'applications-xlsx') {
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
        setMessage('Applications CSV downloaded.')
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
        setMessage('PDF report templates are prepared for a later release.')
      }
    } catch {
      setMessage('Export failed. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  const actions = [
    { id: 'revenue', title: 'Revenue Summary (CSV)', description: 'GS + subscription revenue totals.', icon: Download },
    { id: 'users', title: 'Export Users (CSV)', description: 'Farmer profiles export.', icon: Download },
    { id: 'subscriptions', title: 'Export Subscriptions (CSV)', description: 'Premium subscription ledger.', icon: Download },
    { id: 'gram-sahakari', title: 'Export Gram Sahakari (CSV)', description: 'Applications export.', icon: Download },
    { id: 'applications-csv', title: 'Export Applications sample (CSV)', description: 'Latest applications sample.', icon: Download },
    { id: 'payments-csv', title: 'Export GS Payments (CSV)', description: 'Registration fee payments.', icon: Download },
    { id: 'applications-xlsx', title: 'Export Applications (Excel)', description: 'Excel-compatible spreadsheet export.', icon: FileSpreadsheet },
    { id: 'pdf', title: 'Export PDF Report', description: 'Structured PDF summary (coming soon).', icon: FileText },
  ] as const

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        description="Export operational data for finance and field teams."
      />

      {message ? (
        <p className="mb-4 rounded-xl border border-mist bg-white px-4 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <AdminCard key={action.id}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-forest-50 p-2 text-forest-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink">{action.title}</h3>
                  <p className="mt-1 text-xs text-steel">{action.description}</p>
                  <button
                    type="button"
                    disabled={busy === action.id}
                    onClick={() => void runExport(action.id)}
                    className="mt-3 rounded-xl bg-forest-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy === action.id ? 'Exporting…' : 'Download'}
                  </button>
                </div>
              </div>
            </AdminCard>
          )
        })}
      </div>
    </div>
  )
}
