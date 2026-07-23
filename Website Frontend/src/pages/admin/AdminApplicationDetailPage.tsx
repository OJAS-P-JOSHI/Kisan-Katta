import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { GramSahakariIDCard } from '@/components/id-card'
import {
  AdminCard,
  AdminPageHeader,
  TableSkeleton,
  formatDateTime,
} from '@/components/admin/AdminUI'
import { StatusBadge } from '@/components/application/StatusBadge'
import { useAdminApplication } from '@/hooks/useAdmin'
import { isIDCardEligible } from '@/lib/gram-sahakari-id'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-steel">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{value?.trim() || '—'}</dd>
    </div>
  )
}

function DocLink({
  label,
  url,
}: {
  label: string
  url?: string | null
}) {
  if (!url) {
    return (
      <div className="rounded-xl border border-dashed border-mist px-4 py-6 text-center text-xs text-steel">
        {label}: not uploaded
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between rounded-xl border border-mist px-4 py-3 text-sm hover:border-forest-100 hover:bg-forest-50/40"
    >
      <span className="font-medium text-ink">{label}</span>
      <ExternalLink className="h-4 w-4 text-steel group-hover:text-forest-700" />
    </a>
  )
}

export function AdminApplicationDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError } = useAdminApplication(id)

  if (isLoading) {
    return (
      <div>
        <AdminPageHeader title="Application details" />
        <AdminCard>
          <TableSkeleton rows={8} />
        </AdminCard>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div>
        <AdminPageHeader title="Application details" />
        <AdminCard>
          <p className="text-sm text-red-600">Application not found.</p>
          <Link
            to="/admin/applications"
            className="mt-3 inline-flex items-center gap-2 text-sm text-forest-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to applications
          </Link>
        </AdminCard>
      </div>
    )
  }

  const showId = isIDCardEligible(data)

  return (
    <div>
      <AdminPageHeader
        title={data.applicationNumber}
        description={data.fullName ?? 'Gram Sahakari application'}
        actions={
          <Link
            to="/admin/applications"
            className="inline-flex items-center gap-2 rounded-xl border border-mist px-3 py-2 text-sm font-medium text-ink hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <StatusBadge kind="application" status={data.status} />
        <span className="rounded-full border border-mist px-3 py-1 text-xs font-medium text-steel">
          Payment: {data.paymentStatus}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <AdminCard title="Applicant">
            <div className="flex flex-col gap-6 sm:flex-row">
              {data.photo?.url ? (
                <img
                  src={data.photo.url}
                  alt={data.fullName ?? 'Applicant'}
                  className="h-28 w-28 rounded-2xl object-cover shadow-soft"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-mist text-xs text-steel">
                  No photo
                </div>
              )}
              <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" value={data.fullName} />
                <Field
                  label="Phone"
                  value={data.phoneNumber ?? data.phone}
                />
                <Field label="Email" value={data.email} />
                <Field label="Gender" value={data.gender} />
                <Field
                  label="Date of birth"
                  value={data.dob ? formatDateTime(data.dob).split(',')[0] : null}
                />
                <Field label="Aadhaar" value={data.aadhaarNumber} />
              </dl>
            </div>
          </AdminCard>

          <AdminCard title="Address">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Address" value={data.address} />
              <Field label="Village" value={data.village} />
              <Field label="Taluka" value={data.taluka} />
              <Field label="District" value={data.district} />
              <Field label="PIN" value={data.pincode} />
            </dl>
          </AdminCard>

          <AdminCard title="Bank">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Account holder" value={data.bankAccountHolder} />
              <Field label="Account number" value={data.bankAccountNumber} />
              <Field label="IFSC" value={data.bankIFSC} />
              <Field label="Bank name" value={data.bankName} />
            </dl>
          </AdminCard>

          <AdminCard title="Documents">
            <div className="grid gap-3 sm:grid-cols-2">
              <DocLink label="Photo" url={data.photo?.url} />
              <DocLink label="Aadhaar front" url={data.aadhaarFront?.url} />
              <DocLink label="Aadhaar back" url={data.aadhaarBack?.url} />
              <DocLink
                label="Cancelled cheque"
                url={data.cancelledChequeImage?.url}
              />
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Payment">
            <dl className="grid gap-4">
              <Field label="Status" value={data.paymentStatus} />
              <Field label="Reference" value={data.paymentReference} />
              <Field label="Submitted" value={formatDateTime(data.submittedAt)} />
              <Field label="Created" value={formatDateTime(data.createdAt)} />
              <Field label="Updated" value={formatDateTime(data.updatedAt)} />
            </dl>
          </AdminCard>

          <AdminCard title="Timeline">
            <ol className="relative space-y-4 border-l border-mist pl-4">
              <li>
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-forest-500" />
                <p className="text-sm font-medium text-ink">Application created</p>
                <p className="text-xs text-steel">{formatDateTime(data.createdAt)}</p>
              </li>
              {data.status !== 'DRAFT' ? (
                <li>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-amber-500" />
                  <p className="text-sm font-medium text-ink">Payment pending</p>
                  <p className="text-xs text-steel">Moved to payment flow</p>
                </li>
              ) : null}
              {data.status === 'SUBMITTED' ? (
                <li>
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-forest-700" />
                  <p className="text-sm font-medium text-ink">Submitted</p>
                  <p className="text-xs text-steel">
                    {formatDateTime(data.submittedAt)}
                  </p>
                </li>
              ) : null}
            </ol>
          </AdminCard>

          {showId ? (
            <AdminCard title="ID Card">
              <div className="overflow-hidden rounded-xl">
                <GramSahakariIDCard application={data} showHeading={false} />
              </div>
            </AdminCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
