import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  archiveAdminMarketplace,
  deleteAdminMarketplace,
  getAdminMarketplaceListing,
  listAdminMarketplace,
  restoreAdminMarketplace,
} from '@/api/admin-ops.api'
import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  FilterPanel,
  filterControlClass,
} from '@/components/admin/FilterPanel'
import {
  AdminCard,
  AdminPageHeader,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/api-error'

export function AdminMarketplacePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [listingType, setListingType] = useState('')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
      listingType: listingType || undefined,
    }),
    [page, search, status, listingType],
  )

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin', 'marketplace', query],
    queryFn: () => listAdminMarketplace(query),
    placeholderData: (prev) => prev,
  })

  const moderate = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string
      action: 'archive' | 'restore' | 'delete'
    }) => {
      if (action === 'archive') return archiveAdminMarketplace(id, 'moderation')
      if (action === 'restore') return restoreAdminMarketplace(id, 'restore')
      return deleteAdminMarketplace(id, 'delete')
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['admin', 'marketplace'] }),
  })

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <Link
          to={`/admin/marketplace/${String(row.id)}`}
          className="font-medium text-forest-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(row.title)}
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => String(row.listingType),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => String(row.status),
    },
    {
      key: 'seller',
      header: 'Seller',
      render: (row) => (
        <Link
          to={`/admin/users/${String(row.sellerId)}`}
          className="text-forest-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(row.sellerName ?? row.sellerMobile ?? row.sellerId)}
        </Link>
      ),
    },
    {
      key: 'district',
      header: 'District',
      render: (row) => String(row.district),
    },
    {
      key: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      render: (row) => formatDateTime(row.createdAt as string),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          {row.status !== 'ARCHIVED' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Force archive this listing?')) {
                  moderate.mutate({ id: String(row.id), action: 'archive' })
                }
              }}
            >
              Hide
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Restore listing?')) {
                  moderate.mutate({ id: String(row.id), action: 'restore' })
                }
              }}
            >
              Restore
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Marketplace"
        description="Moderate product, produce, and labour listings."
      />

      <AdminCard padded={false}>
        <div className="p-4 sm:p-5">
          <div className="mb-3">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Title, district, seller id…"
              className={filterControlClass}
              aria-label="Search marketplace"
            />
          </div>
          <FilterPanel activeCount={[status, listingType].filter(Boolean).length}>
            <select
              className={filterControlClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="SOLD">SOLD</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <select
              className={filterControlClass}
              value={listingType}
              onChange={(e) => {
                setListingType(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All types</option>
              <option value="product">product</option>
              <option value="produce">produce</option>
              <option value="labour">labour</option>
            </select>
          </FilterPanel>
        </div>

      {error ? (
        <AdminCard>
          <p className="text-sm text-red-700">
            {getErrorMessage(error, 'Failed to load listings.')}
          </p>
        </AdminCard>
      ) : (
        <AdminCard padded={false}>
          <DataTable
            columns={columns}
            rows={(data?.items as Array<Record<string, unknown>>) ?? []}
            loading={isLoading || isFetching}
            empty="No listings found."
            onRowClick={(row) => navigate(`/admin/marketplace/${String(row.id)}`)}
          />
          <Pagination
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 0}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </AdminCard>
      )}
    </div>
  )
}

export function AdminMarketplaceDetailPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'marketplace', id],
    queryFn: () => getAdminMarketplaceListing(id),
    enabled: Boolean(id),
  })

  const moderate = useMutation({
    mutationFn: (action: 'archive' | 'restore' | 'delete') => {
      if (action === 'archive') return archiveAdminMarketplace(id, 'detail_archive')
      if (action === 'restore') return restoreAdminMarketplace(id, 'detail_restore')
      return deleteAdminMarketplace(id, 'detail_delete')
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'marketplace', id] })
    },
  })

  if (isLoading) return <p className="text-sm text-steel">Loading…</p>
  if (error || !data) {
    return (
      <AdminCard>
        <p className="text-sm text-red-700">
          {getErrorMessage(error, 'Listing not found.')}
        </p>
      </AdminCard>
    )
  }

  const listing = data.listing as Record<string, unknown>
  const seller = data.seller as Record<string, unknown>
  const images = (listing.images as Array<{ url?: string }>) ?? []

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={String(listing.title)}
        description={`${String(listing.listingType)} · ${String(listing.status)}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/marketplace')}>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('Archive listing?')) moderate.mutate('archive')
              }}
            >
              Force archive
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700"
              onClick={() => {
                if (window.confirm('Delete (archive) listing?'))
                  moderate.mutate('delete')
              }}
            >
              Delete
            </Button>
          </div>
        }
      />

      <AdminCard title="Seller">
        <Link
          to={`/admin/users/${String(seller.userId)}`}
          className="text-forest-800 hover:underline"
        >
          {String(seller.name ?? seller.mobile)} · {String(seller.district)}
        </Link>
      </AdminCard>

      <AdminCard title="Details">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-steel">Price</dt>
            <dd>₹{String(listing.price)}</dd>
          </div>
          <div>
            <dt className="text-steel">Location</dt>
            <dd>
              {String(listing.village ?? '—')}, {String(listing.district)}
            </dd>
          </div>
          <div>
            <dt className="text-steel">Expires</dt>
            <dd>{formatDateTime(listing.expiresAt as string)}</dd>
          </div>
          <div>
            <dt className="text-steel">Views / Contacts</dt>
            <dd>
              {String(listing.views)} / {String(listing.contactClicks)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-slate">{String(listing.description ?? '')}</p>
      </AdminCard>

      <AdminCard title="Images">
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) =>
            img.url ? (
              <img
                key={i}
                src={img.url}
                alt=""
                className="h-28 w-28 rounded-xl object-cover"
              />
            ) : null,
          )}
          {!images.length && <p className="text-sm text-steel">No images.</p>}
        </div>
      </AdminCard>

      <AdminCard title="Seller history">
        {((data.sellerHistory as Array<Record<string, unknown>>) ?? []).map((row) => (
          <Link
            key={String(row.id)}
            to={`/admin/marketplace/${String(row.id)}`}
            className="mb-2 block rounded-xl border border-mist px-3 py-2 text-sm"
          >
            {String(row.title)} · {String(row.status)}
          </Link>
        ))}
      </AdminCard>
    </div>
  )
}
