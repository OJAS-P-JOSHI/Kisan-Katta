import axios from 'axios'
import * as XLSX from 'xlsx'

import { api } from '@/api/axios'

function sheetNameFromType(type: string): string {
  const names: Record<string, string> = {
    revenue: 'Revenue Summary',
    users: 'Farmers',
    subscriptions: 'Subscriptions',
    'gram-sahakari': 'Gram Sahakari',
    payments: 'Payments Ledger',
    marketplace: 'Marketplace',
  }
  return names[type] ?? 'Report'
}

function xlsxFilename(type: string, contentDisposition?: string | null): string {
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i)
  const fromHeader = match?.[1]?.replace(/\.csv$/i, '')
  const base = fromHeader || `${type}-export`
  return `${base}.xlsx`
}

/**
 * Fetches an admin CSV report and downloads it as a real Excel (.xlsx) workbook.
 */
export async function downloadAdminReportXlsx(type: string): Promise<string> {
  let response
  try {
    response = await api.get<string>(`/api/v1/admin/reports/export/${type}`, {
      responseType: 'text',
    })
  } catch (error) {
    // responseType: 'text' keeps error bodies as strings — surface API message.
    if (axios.isAxiosError(error) && typeof error.response?.data === 'string') {
      try {
        const parsed = JSON.parse(error.response.data) as { message?: string }
        if (parsed.message) {
          throw new Error(parsed.message)
        }
      } catch (parsedError) {
        if (parsedError instanceof Error && parsedError.message !== error.message) {
          throw parsedError
        }
      }
    }
    throw error
  }

  const csv = String(response.data ?? '').trim()
  if (!csv) {
    throw new Error('The report came back empty. There may be no data yet.')
  }

  // Guard: API/HTML error pages should not be saved as Excel.
  if (csv.startsWith('<!') || csv.startsWith('<html')) {
    throw new Error('Export failed. The server returned an unexpected page.')
  }

  const workbook = XLSX.read(csv, { type: 'string', FS: ',' })
  const oldName = workbook.SheetNames[0]
  const newName = sheetNameFromType(type)
  if (oldName && oldName !== newName && workbook.Sheets[oldName]) {
    workbook.Sheets[newName] = workbook.Sheets[oldName]!
    delete workbook.Sheets[oldName]
    workbook.SheetNames[0] = newName
  }

  const filename = xlsxFilename(
    type,
    response.headers?.['content-disposition'] as string | undefined,
  )
  XLSX.writeFile(workbook, filename)
  return filename
}
