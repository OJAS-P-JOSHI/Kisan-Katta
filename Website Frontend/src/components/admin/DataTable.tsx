import type { ReactNode } from 'react'

import { EmptyState, TableSkeleton } from '@/components/admin/AdminUI'
import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: string
  className?: string
  /** Optional mobile card label; defaults to header. */
  mobileLabel?: string
  /** Hide this column in mobile card layout. */
  hideOnMobile?: boolean
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  /** Primary field shown as card title on mobile (column key). */
  mobileTitleKey?: string
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle = 'No records found',
  emptyDescription,
  rowKey,
  onRowClick,
  mobileTitleKey,
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton />

  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const titleCol =
    columns.find((c) => c.key === mobileTitleKey) ?? columns[0]
  const mobileCols = columns.filter(
    (c) => !c.hideOnMobile && c.key !== titleCol?.key,
  )

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <button
            key={rowKey(row)}
            type="button"
            onClick={() => onRowClick?.(row)}
            className={cn(
              'block w-full rounded-2xl border border-mist bg-white p-4 text-left shadow-soft',
              onRowClick && 'active:bg-forest-50/50',
            )}
          >
            <div className="text-sm font-semibold text-ink">
              {titleCol ? titleCol.render(row) : null}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              {mobileCols.slice(0, 6).map((col) => (
                <div key={col.key} className="min-w-0">
                  <dt className="text-[10px] font-medium uppercase tracking-wide text-steel">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className="mt-0.5 truncate text-xs text-ink">
                    {col.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>

      {/* Desktop / tablet table */}
      <div className="-mx-4 hidden overflow-x-auto md:mx-0 md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-y border-mist text-xs uppercase tracking-wide text-steel">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'whitespace-nowrap px-4 py-3 font-medium sm:px-5',
                    col.className,
                  )}
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
                className={cn(
                  'border-b border-mist/80 transition-colors hover:bg-forest-50/40',
                  onRowClick && 'cursor-pointer',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-3.5 text-ink sm:px-5',
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-steel">
        {totalPages <= 1
          ? `${total} result${total === 1 ? '' : 's'}`
          : `Page ${page} of ${totalPages} · ${total} total`}
      </p>
      {totalPages > 1 ? (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="min-h-10 rounded-xl border border-mist px-4 py-2 text-xs font-medium text-ink disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="min-h-10 rounded-xl border border-mist px-4 py-2 text-xs font-medium text-ink disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
