import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { useAdminVolunteers } from '@/hooks/useAdmin'
import type { VolunteerListItem } from '@/types/admin.types'

export function AdminGramSahakarisPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      district: district || undefined,
    }),
    [page, search, district],
  )

  const { data, isLoading, isFetching } = useAdminVolunteers(query)

  const columns: Column<VolunteerListItem>[] = [
    {
      key: 'photo',
      header: '',
      render: (row) =>
        row.photoUrl ? (
          <img
            src={row.photoUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-mist" />
        ),
    },
    {
      key: 'volunteerId',
      header: 'Volunteer ID',
      render: (row) => (
        <span className="font-medium text-forest-900">{row.volunteerId}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Name',
      render: (row) => row.fullName ?? '—',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => row.phoneNumber ?? row.phone ?? '—',
    },
    {
      key: 'district',
      header: 'District',
      render: (row) => row.district ?? '—',
    },
    {
      key: 'taluka',
      header: 'Taluka',
      render: (row) => row.taluka ?? '—',
    },
    {
      key: 'submittedAt',
      header: 'Approved',
      render: (row) => formatDateTime(row.submittedAt),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-3">
          <Link
            to={`/admin/applications/${row.id}`}
            className="text-xs font-semibold text-forest-700 hover:underline"
          >
            View
          </Link>
          <Link
            to={`/admin/applications/${row.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-steel hover:text-forest-700"
            title="Open ID card on detail page"
          >
            <Download className="h-3.5 w-3.5" />
            ID
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Gram Sahakaris"
        description="Approved volunteers with completed registration and payment."
      />

      <AdminCard>
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Search name, phone, ID…"
            className="rounded-xl border border-mist px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500/30 lg:col-span-2"
          />
          <input
            value={district}
            onChange={(e) => {
              setPage(1)
              setDistrict(e.target.value)
            }}
            placeholder="District"
            className="rounded-xl border border-mist px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest-500/30"
          />
        </div>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          loading={isLoading || (isFetching && !data)}
          rowKey={(row) => row.id}
          emptyTitle="No approved Gram Sahakaris yet"
        />
        <Pagination
          page={data?.page ?? page}
          totalPages={data?.totalPages ?? 1}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />

        <p className="mt-4 text-xs text-steel">
          Suspend / Activate controls will be available in a future release.
        </p>
      </AdminCard>
    </div>
  )
}
