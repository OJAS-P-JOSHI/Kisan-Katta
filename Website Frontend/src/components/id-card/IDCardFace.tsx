import { ShieldCheck, UserRound } from 'lucide-react'
import { forwardRef } from 'react'

import { brandAssets } from '@/data/images'
import { useQRDataUrl } from '@/hooks/useQRDataUrl'
import { translate } from '@/i18n/translations'
import type { Locale } from '@/i18n/types'
import { buildQRContent, type IDCardPayload } from '@/lib/gram-sahakari-id'
import { cn } from '@/lib/utils'

interface IDCardFaceProps {
  payload: IDCardPayload
  /** Card-only locale — independent of website language. */
  locale: Locale
  className?: string
}

/** Single elevation used across the card for print-safe consistency. */
const CARD_SHADOW = '0 8px 28px -10px rgb(26 77 46 / 0.14)'
const PHOTO_SHADOW = '0 2px 10px -2px rgb(26 77 46 / 0.12)'

/**
 * Designations are always English on both EN and MR cards (client requirement).
 * Do not pass these through i18n.
 */
const ROLE_FOUNDER = 'Founder'
const ROLE_CO_FOUNDER = 'Co-Founder'

/** Display size for QR; generator still renders at 2× for crisp exports. */
const QR_DISPLAY_PX = 120

/**
 * Pure visual face of the Digital ID — captured for PNG/PDF.
 * Version 3: mobile-only (≤768px) photo | QR top row; md+ keeps Version 2.
 */
export const IDCardFace = forwardRef<HTMLDivElement, IDCardFaceProps>(function IDCardFace(
  { payload, locale, className },
  ref,
) {
  const t = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) =>
    translate(locale, key, params)
  const qrContent = buildQRContent(payload)
  const qrDataUrl = useQRDataUrl(qrContent, QR_DISPLAY_PX)

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-forest-100 bg-white text-left',
        locale === 'mr' && 'font-marathi',
        className,
      )}
      style={{ boxShadow: CARD_SHADOW }}
    >
      {/* Top brand bar */}
      <div className="relative z-10 flex items-center gap-3 border-b border-forest-100 bg-forest-900 px-5 py-3.5">
        <img
          src={brandAssets.logo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full bg-white object-cover ring-2 ring-white/25"
          crossOrigin="anonymous"
        />
        <div className="min-w-0 flex-1 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-100">
            Kisan Katta
          </p>
          <h2 className="truncate text-sm font-bold leading-snug sm:text-[15px]">
            {t('idCard.title')}
          </h2>
          <p className="text-[11px] text-white/70">{t('idCard.subtitle')}</p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 text-[10px] font-bold uppercase tracking-wide text-forest-800">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500"
            aria-hidden
          />
          {t('idCard.active')}
        </span>
      </div>

      {/*
        Body layout
        - Mobile (≤768px / <md): Version 3 — Photo | QR row, then full-width identity
        - md+: Version 2 — Photo+QR column | identity column (unchanged)
      */}
      <div className="relative z-10 grid grid-cols-2 items-start gap-x-4 gap-y-4 p-5 md:grid-cols-[120px_1fr] md:gap-5">
        {/* Subtle watermark — stays behind content, never overlaps readability */}
        <img
          src={brandAssets.logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-44 w-44 -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.038]"
          crossOrigin="anonymous"
        />

        {/* Profile photo (+ verification badge) */}
        <div className="relative z-10 mx-auto w-full max-w-[160px] md:mx-0 md:w-[120px] md:max-w-none">
          <div
            className="relative aspect-square w-full overflow-hidden rounded-lg bg-forest-50"
            style={{
              boxShadow: PHOTO_SHADOW,
              border: '2px solid #4F772D',
            }}
          >
            {payload.photoUrl ? (
              <img
                src={payload.photoUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
                crossOrigin="anonymous"
                loading="eager"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-forest-700">
                <UserRound className="h-10 w-10 opacity-70" aria-hidden />
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-60">
                  {t('idCard.noPhoto')}
                </span>
              </div>
            )}
          </div>

          <div
            className="absolute -bottom-1.5 -right-1.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-forest-100 bg-white"
            style={{ boxShadow: PHOTO_SHADOW }}
            title={t('idCard.verifiedSecurity')}
            aria-label={t('idCard.verifiedSecurity')}
          >
            <img
              src={brandAssets.logo}
              alt=""
              className="h-6 w-6 rounded-full object-cover opacity-90"
              crossOrigin="anonymous"
            />
            <ShieldCheck
              className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-forest-700"
              aria-hidden
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* QR — mobile: right of photo; md+: under photo in left column */}
        <div className="relative z-10 flex w-full flex-col items-center gap-1.5 self-start md:col-start-1 md:w-[120px] md:justify-self-start md:pt-1">
          <div
            className="rounded-lg border border-forest-100 bg-white p-1.5"
            style={{ boxShadow: PHOTO_SHADOW }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt=""
                width={QR_DISPLAY_PX}
                height={QR_DISPLAY_PX}
                className="h-[120px] w-[120px] max-md:h-[112px] max-md:w-[112px]"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center bg-forest-50 text-[10px] text-steel max-md:h-[112px] max-md:w-[112px]">
                QR
              </div>
            )}
          </div>
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-800">
            {t('idCard.scanToVerify')}
          </p>
        </div>

        {/* Identity — full width under photo|QR on mobile; right column on md+ */}
        <div className="relative z-10 col-span-2 min-w-0 space-y-3.5 md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
              {t('idCard.name')}
            </p>
            <p className="mt-1 truncate text-xl font-bold leading-tight tracking-tight text-ink sm:text-[22px]">
              {payload.fullName}
            </p>
          </div>

          <div className="rounded-lg border border-forest-100 bg-[#F7F8F6] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
              {t('idCard.volunteerId')}
            </p>
            <p className="mt-1 font-mono text-[15px] font-bold tracking-wide text-forest-900 sm:text-base">
              {payload.volunteerId}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Field label={t('idCard.district')} value={payload.district} />
            <Field label={t('idCard.taluka')} value={payload.taluka} />
            <Field label={t('idCard.village')} value={payload.village} />
            <Field label={t('idCard.mobile')} value={payload.phoneDisplay} />
            <Field label={t('idCard.issued')} value={payload.issuedAtDisplay} />
            <Field label={t('idCard.appNo')} value={payload.applicationNumber} mono />
          </dl>
        </div>
      </div>

      {/* Dual authorization — equal Founder / Co-Founder columns */}
      <div className="relative z-10 border-t border-forest-100 bg-[#FAFBFA] px-4 py-3.5 sm:px-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <AuthorityBlock
            authorizedBy={t('idCard.authorizedBy')}
            role={ROLE_FOUNDER}
            signatureSrc={brandAssets.signature}
            signatureFit="width"
            name={t('idCard.authorizedName')}
            org={t('idCard.authorizedOrg')}
          />
          <AuthorityBlock
            authorizedBy={t('idCard.authorizedBy')}
            role={ROLE_CO_FOUNDER}
            signatureSrc={brandAssets.signatureCoFounder}
            signatureFit="height"
            signatureRotateDeg={-8}
            name={t('idCard.authorizedNameCoFounder')}
            org={t('idCard.authorizedOrg')}
          />
        </div>
      </div>

      {/* Professional credential footer */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-forest-100 bg-white px-5 py-2">
        <p className="text-[10px] font-medium text-steel">
          {t('idCard.officialFooter')}
        </p>
        <p className="text-[10px] text-steel">
          {t('idCard.issuedBy')}
          <span className="mx-1.5 text-mist">·</span>
          {t('idCard.version', { version: payload.version })}
        </p>
      </div>

      <div aria-hidden className="h-1 w-full bg-forest-900" />
    </div>
  )
})

/** Always-English role labels — never use Marathi font for designations. */
function AuthorityBlock({
  authorizedBy,
  role,
  signatureSrc,
  signatureFit,
  signatureRotateDeg = 0,
  name,
  org,
}: {
  authorizedBy: string
  role: string
  signatureSrc: string
  /** width = wide founder stroke; height = tall co-founder stroke */
  signatureFit: 'width' | 'height'
  signatureRotateDeg?: number
  name: string
  org: string
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-forest-100/90 bg-white px-2.5 py-2 sm:px-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-steel sm:text-[10px] sm:tracking-[0.14em]">
        {authorizedBy}
      </p>
      <p className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-forest-800">
        {role}
      </p>

      {/* Identical signing slot for both columns — signatures centered, left-aligned with name */}
      <div className="mt-2.5 mb-0.5 flex h-[72px] items-center justify-start overflow-visible">
        <img
          src={signatureSrc}
          alt=""
          className={cn(
            'object-contain object-left',
            /* Founder: wide stroke — cap by width */
            signatureFit === 'width' && 'h-auto w-auto max-w-[140px]',
            /* Co-Founder: ~18% larger than prior 60px height cap — never stretch */
            signatureFit === 'height' && 'h-auto w-auto max-h-[71px] max-w-full',
          )}
          style={
            signatureRotateDeg
              ? {
                  transform: `rotate(${signatureRotateDeg}deg)`,
                  transformOrigin: 'left bottom',
                }
              : undefined
          }
          crossOrigin="anonymous"
          loading="eager"
          decoding="async"
        />
      </div>

      <p className="truncate text-[11px] font-semibold leading-tight text-ink sm:text-[12px]">
        {name}
      </p>
      <p className="mt-px font-sans text-[10px] leading-tight text-steel">{role}</p>
      <p className="mt-px text-[10px] font-semibold leading-tight text-forest-800">{org}</p>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 truncate text-[13px] font-semibold leading-snug text-ink',
          mono && 'font-mono tracking-wide',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
