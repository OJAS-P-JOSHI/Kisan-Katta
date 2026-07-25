import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { Seo } from '@/components/common/Seo'
import { Button } from '@/components/ui/button'
import { useVerifyVolunteer } from '@/hooks/useVerifyVolunteer'
import { toVolunteerId } from '@/lib/gram-sahakari-id'
import { cn } from '@/lib/utils'
import type { VerificationSuccess } from '@/api/verification.api'

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-mist/80 py-3 last:border-0">
      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-steel">
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function VerifiedCard({ data }: { data: VerificationSuccess }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-forest-700"
        aria-hidden
      >
        <CheckCircle2 className="h-9 w-9" strokeWidth={2} />
      </div>
      <p className="mt-4 text-lg font-semibold text-forest-800">
        Verified Volunteer
      </p>
      <p className="mt-1 text-sm text-steel" role="status">
        This Village Representative identity is authentic.
      </p>

      <div className="mt-6 flex flex-col items-center">
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name}
            className="h-28 w-28 rounded-2xl object-cover shadow-soft ring-2 ring-forest-100"
          />
        ) : (
          <div
            className="flex h-28 w-28 items-center justify-center rounded-2xl bg-forest-50 text-2xl font-semibold text-forest-800"
            aria-hidden
          >
            {data.name.slice(0, 1)}
          </div>
        )}
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          {data.name}
        </h2>
        <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-forest-800">
          {data.volunteerId}
        </p>
      </div>

      <dl className="mt-6 rounded-2xl border border-mist bg-[#F7F8F6]/80 px-4 text-left">
        <InfoRow label="District" value={data.district} />
        <InfoRow label="Taluka" value={data.taluka} />
        <InfoRow label="Village" value={data.village} />
        <InfoRow
          label="Registration Date"
          value={formatDisplayDate(data.issuedAt)}
        />
        <InfoRow label="Status" value={data.status} />
        <InfoRow
          label="Verification Time"
          value={formatDisplayDate(data.verifiedAt)}
        />
      </dl>
    </div>
  )
}

function NotFoundCard({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600"
        aria-hidden
      >
        <XCircle className="h-9 w-9" strokeWidth={2} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink">Volunteer Not Found</h2>
      <p className="mt-2 text-sm leading-relaxed text-steel" role="alert">
        {message || 'The provided Volunteer ID does not exist.'}
      </p>
    </div>
  )
}

function InactiveCard({ message }: { message: string }) {
  return (
    <div className="text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600"
        aria-hidden
      >
        <AlertTriangle className="h-9 w-9" strokeWidth={2} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink">Volunteer Inactive</h2>
      <p className="mt-2 text-sm leading-relaxed text-steel" role="alert">
        {message || 'This volunteer is currently inactive.'}
      </p>
    </div>
  )
}

/**
 * Public Gram Sahakari verification page.
 * No authentication — anyone with a Volunteer ID / QR scan can verify.
 */
export function VerifyVolunteerPage() {
  const { volunteerId: rawId } = useParams<{ volunteerId: string }>()
  const volunteerId = rawId ? toVolunteerId(decodeURIComponent(rawId)) : ''

  const { data, isLoading, isError, isFetching } = useVerifyVolunteer(volunteerId)

  const isInactive =
    data &&
    data.verified === false &&
    /inactive/i.test(data.message)

  const seoTitle = !volunteerId
    ? 'Volunteer Verification — Kisan Katta'
    : isLoading || isFetching
      ? 'Verifying Volunteer — Kisan Katta'
      : data?.verified
        ? `Verified Volunteer — ${data.name}`
        : isInactive
          ? 'Volunteer Inactive — Kisan Katta'
          : 'Volunteer Not Found — Kisan Katta'

  const seoDescription = data?.verified
    ? `Official verification for Village Representative ${data.volunteerId} (${data.name}).`
    : 'Official Kisan Katta Village Representative Digital Verification Portal.'

  return (
    <>
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={`/verify/${volunteerId || ''}`}
      />

      <div className="min-h-dvh overflow-x-hidden bg-[#F3F5F1]">
        <header className="border-b border-mist bg-white">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4 sm:px-6">
            <img
              src="/logo-circle.png"
              alt="Kisan Katta"
              className="h-10 w-10 rounded-full"
              width={40}
              height={40}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Kisan Katta</p>
              <p className="text-[11px] text-steel">Digital Verification</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-forest-100 bg-white px-3 py-1 text-xs font-medium text-forest-800">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Official Portal
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Village Representative Verification
            </h1>
            <p className="mt-2 text-sm text-steel">
              Official Volunteer Verification Portal
            </p>
          </div>

          <section
            className={cn(
              'rounded-3xl border border-mist bg-white p-5 shadow-soft sm:p-8',
            )}
            aria-live="polite"
          >
            {!volunteerId ? (
              <NotFoundCard message="The provided Volunteer ID does not exist." />
            ) : isLoading ? (
              <div className="flex flex-col items-center py-10 text-steel">
                <Loader2
                  className="h-8 w-8 animate-spin text-forest-700"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium">Verifying volunteer…</p>
              </div>
            ) : isError ? (
              <NotFoundCard message="Unable to verify right now. Please try again." />
            ) : data?.verified ? (
              <VerifiedCard data={data} />
            ) : isInactive ? (
              <InactiveCard message={data.message} />
            ) : (
              <NotFoundCard
                message={data?.message ?? 'The provided Volunteer ID does not exist.'}
              />
            )}
          </section>

          <p className="mt-8 text-center text-xs leading-relaxed text-steel">
            Verified by
            <br />
            <span className="font-semibold text-ink">
              Kisan Katta Digital Verification System
            </span>
          </p>

          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    </>
  )
}
