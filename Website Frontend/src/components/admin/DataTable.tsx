import type { ReactNode } from 'react'

import { EmptyState, TableSkeleton } from '@/components/admin/AdminUI'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  rowKey: (row: T) => string
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle = 'No records found',
  emptyDescription,
  rowKey,
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton />

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="border-y border-mist text-xs uppercase tracking-wide text-steel">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('whitespace-nowrap px-5 py-3 font-medium', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-mist/80 transition-colors hover:bg-forest-50/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('whitespace-nowrap px-5 py-3.5 text-ink', col.className)}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-xs text-steel">
        {total} result{total === 1 ? '' : 's'}
      </p>
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-steel">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-mist px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-mist px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}
