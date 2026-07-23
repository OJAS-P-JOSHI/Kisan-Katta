import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import {
  AccountStatusBadge,
  AdminPageHeader,
  InfoGrid,
  ProfileSection,
  TableSkeleton,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { useAdminFarmer } from '@/hooks/useAdmin'

export function AdminFarmerDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useAdminFarmer(id)

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Farmer profile" />
        <ProfileSection title="Loading">
          <TableSkeleton rows={8} />
        </ProfileSection>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <AdminPageHeader title="Farmer profile" />
        <ProfileSection title="Not found">
          <p className="text-sm text-red-600">Farmer not found.</p>
          <Link
            to="/admin/farmers"
            className="mt-3 inline-flex items-center gap-2 text-sm text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to farmers
          </Link>
        </ProfileSection>
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title={data.name}
        description={`${data.village}, ${data.district}`}
        actions={
          <Link
            to="/admin/farmers"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mist bg-white px-3 py-2 text-sm font-medium text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AccountStatusBadge status={data.accountStatus} />
        <span className="rounded-full border border-mist px-3 py-1 text-xs font-medium text-steel">
          {data.role}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <ProfileSection title="Basic Information">
          <div className="mb-5 flex items-center gap-4">
            {data.photoUrl ? (
              <img
                src={data.photoUrl}
                alt={data.name}
                className="h-20 w-20 rounded-2xl object-cover shadow-soft"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-forest-50 text-xl font-semibold text-forest-800">
                {data.name.slice(0, 1)}
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-ink">{data.name}</p>
              <p className="text-sm tabular-nums text-steel">
                {data.mobile ?? '—'}
              </p>
            </div>
          </div>
          <InfoGrid
            items={[
              { label: 'Full Name', value: data.name },
              { label: 'Mobile Number', value: data.mobile },
              { label: 'Email', value: data.email ?? '—' },
              { label: 'Gender', value: data.gender ?? '—' },
              { label: 'Date of Birth', value: data.dob ?? '—' },
            ]}
          />
        </ProfileSection>

        <ProfileSection title="Location">
          <InfoGrid
            items={[
              { label: 'Village', value: data.village },
              { label: 'Taluka', value: data.taluka },
              { label: 'District', value: data.district },
              { label: 'State', value: data.state },
              { label: 'PIN', value: data.pincode ?? '—' },
            ]}
          />
        </ProfileSection>

        <ProfileSection title="Agriculture">
          <InfoGrid
            items={[
              {
                label: 'Favourite Crops',
                value: data.favoriteCrops.length
                  ? data.favoriteCrops.join(', ')
                  : '—',
              },
              { label: 'Farm Size', value: data.farmSize ?? '—' },
              { label: 'Farming Type', value: data.farmingType ?? '—' },
            ]}
          />
        </ProfileSection>

        <ProfileSection title="Account">
          <InfoGrid
            items={[
              {
                label: 'Registered On',
                value: formatDateTime(data.registeredAt),
              },
              {
                label: 'Last Login',
                value: formatDateTime(data.lastActiveAt),
              },
              { label: 'Language', value: data.languageLabel },
              { label: 'Device', value: data.device ?? '—' },
              {
                label: 'Account Status',
                value: <AccountStatusBadge status={data.accountStatus} />,
              },
            ]}
          />
        </ProfileSection>

        <ProfileSection title="Activity" className="lg:col-span-2">
          <InfoGrid
            columns={3}
            items={[
              {
                label: 'Applications',
                value: data.activity.applications,
              },
              { label: 'Orders', value: '—' },
              { label: 'Community Posts', value: '—' },
              { label: 'Marketplace Listings', value: '—' },
              { label: 'Weather Usage', value: '—' },
            ]}
          />
        </ProfileSection>
      </div>
    </div>
  )
}
