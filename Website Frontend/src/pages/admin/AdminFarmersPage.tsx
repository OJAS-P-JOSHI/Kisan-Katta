import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { DataTable, Pagination, type Column } from '@/components/admin/DataTable'
import {
  FilterPanel,
  filterControlClass,
} from '@/components/admin/FilterPanel'
import {
  AccountStatusBadge,
  AdminCard,
  AdminPageHeader,
  formatDate,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { useAdminFarmers } from '@/hooks/useAdmin'
import type { FarmerListItem } from '@/types/admin.types'

export function AdminFarmersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [district, setDistrict] = useState('')
  const [taluka, setTaluka] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [accountStatus, setAccountStatus] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')

  const query = useMemo(
    () => ({
      page,
      limit: 20,
      search: search || undefined,
      district: district || undefined,
      taluka: taluka || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      accountStatus: accountStatus || undefined,
      sortBy,
      sortOrder: 'desc' as const,
    }),
    [page, search, district, taluka, fromDate, toDate, accountStatus, sortBy],
  )

  const { data, isLoading, isFetching } = useAdminFarmers(query)

  const activeFilters = [
    district,
    taluka,
    fromDate,
    toDate,
    accountStatus,
  ].filter(Boolean).length

  const columns: Column<FarmerListItem>[] = [
    {
      key: 'photo',
      header: '',
      hideOnMobile: true,
      render: (row) =>
        row.photoUrl ? (
          <img
            src={row.photoUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-800">
            {row.name.slice(0, 1)}
          </div>
        ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Link
          to={`/admin/farmers/${row.id}`}
          className="font-medium text-forest-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (row) => (
        <span className="tabular-nums">{row.mobile ?? '—'}</span>
      ),
    },
    {
      key: 'village',
      header: 'Village',
      render: (row) => row.village,
    },
    {
      key: 'taluka',
      header: 'Taluka',
      render: (row) => row.taluka,
    },
    {
      key: 'district',
      header: 'District',
      render: (row) => row.district,
    },
    {
      key: 'state',
      header: 'State',
      hideOnMobile: true,
      render: (row) => row.state,
    },
    {
      key: 'registeredAt',
      header: 'Registered',
      render: (row) => formatDate(row.registeredAt),
    },
    {
      key: 'language',
      header: 'Language',
      hideOnMobile: true,
      render: (row) => row.languageLabel,
    },
    {
      key: 'crops',
      header: 'Crops',
      hideOnMobile: true,
      render: (row) =>
        row.favoriteCrops.length
          ? row.favoriteCrops.slice(0, 2).join(', ') +
            (row.favoriteCrops.length > 2 ? '…' : '')
          : '—',
    },
    {
      key: 'lastActiveAt',
      header: 'Last Active',
      hideOnMobile: true,
      render: (row) => formatDateTime(row.lastActiveAt),
    },
    {
      key: 'accountStatus',
      header: 'Status',
      render: (row) => <AccountStatusBadge status={row.accountStatus} />,
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="Farmers"
        description="Every farmer registered on Kisan Katta."
      />

      <AdminCard padded={false}>
        <div className="p-4 sm:p-5">
          <div className="mb-3">
            <input
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Search name, mobile, village, district…"
              className={filterControlClass}
              aria-label="Search farmers"
            />
          </div>

          <FilterPanel activeCount={activeFilters}>
            <input
              value={district}
              onChange={(e) => {
                setPage(1)
                setDistrict(e.target.value)
              }}
              placeholder="District"
              className={filterControlClass}
            />
            <input
              value={taluka}
              onChange={(e) => {
                setPage(1)
                setTaluka(e.target.value)
              }}
              placeholder="Taluka"
              className={filterControlClass}
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPage(1)
                setFromDate(e.target.value)
              }}
              className={filterControlClass}
              aria-label="From date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPage(1)
                setToDate(e.target.value)
              }}
              className={filterControlClass}
              aria-label="To date"
            />
            <select
              value={accountStatus}
              onChange={(e) => {
                setPage(1)
                setAccountStatus(e.target.value)
              }}
              className={filterControlClass}
              aria-label="Account status"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => {
                setPage(1)
                setSortBy(e.target.value)
              }}
              className={filterControlClass}
              aria-label="Sort by"
            >
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="lastLoginAt">Last active</option>
            </select>
          </FilterPanel>

          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            loading={isLoading || (isFetching && !data)}
            rowKey={(row) => row.id}
            mobileTitleKey="name"
            emptyTitle="No farmers found"
            emptyDescription="Try adjusting search or filters."
            onRowClick={(row) => navigate(`/admin/farmers/${row.id}`)}
          />
          <div className="px-0">
            <Pagination
              page={data?.page ?? page}
              totalPages={data?.totalPages ?? 1}
              total={data?.total ?? 0}
              onPageChange={setPage}
            />
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
