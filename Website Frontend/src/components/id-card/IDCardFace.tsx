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
 * Role + designation stay English on both EN and MR cards (client requirement).
 */
const ROLE_FOUNDER = 'Founder'
const ROLE_CO_FOUNDER = 'Co-Founder'
const ROLE_FOUNDER_DESIGNATION = 'Founder / Director'
const ROLE_CO_FOUNDER_DESIGNATION = 'Co-Founder / Director'

/** Display size for QR; generator still renders at 2× for crisp exports. */
const QR_DISPLAY_PX = 120

/**
 * Pure visual face of the Digital ID — captured for PNG/PDF.
 * Mobile (≤768px) polish only; md+ Version 2 column layout unchanged.
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
      {/* Top brand bar — mobile: wrap title, badge pinned top-right */}
      <div className="relative z-10 flex items-start gap-2.5 border-b border-forest-100 bg-forest-900 px-4 py-3 md:items-center md:gap-3 md:px-5 md:py-3.5">
        <img
          src={brandAssets.logo}
          alt=""
          width={40}
          height={40}
          className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-white object-cover ring-2 ring-white/25 md:mt-0 md:h-10 md:w-10"
          crossOrigin="anonymous"
        />
        <div className="min-w-0 flex-1 pr-1 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-forest-100">
            Kisan Katta
          </p>
          <h2 className="text-[13px] font-bold leading-snug text-balance md:truncate md:text-[15px] md:leading-snug">
            {t('idCard.title')}
          </h2>
          <p className="mt-0.5 text-[10px] leading-snug text-white/70 md:mt-0 md:text-[11px]">
            {t('idCard.subtitle')}
          </p>
        </div>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-forest-800 md:px-2.5 md:text-[10px]">
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-forest-500"
            aria-hidden
          />
          {t('idCard.active')}
        </span>
      </div>

      {/*
        Body layout
        - Mobile (≤768px / <md): Photo | QR row, then full-width identity
        - md+: Photo+QR column | identity column (unchanged)
      */}
      <div className="relative z-10 grid grid-cols-2 items-start gap-x-3 gap-y-5 p-4 md:grid-cols-[120px_1fr] md:gap-5 md:p-5">
        {/* Watermark — very low opacity so it never competes with content */}
        <img
          src={brandAssets.logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.02] md:h-44 md:w-44 md:opacity-[0.038]"
          crossOrigin="anonymous"
        />

        {/* Profile photo — slightly larger on mobile, top-aligned with QR */}
        <div className="relative z-10 w-full justify-self-stretch md:mx-0 md:w-[120px] md:max-w-none md:justify-self-start">
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
            className="absolute -bottom-1.5 -right-1.5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-forest-100 bg-white md:h-9 md:w-9"
            style={{ boxShadow: PHOTO_SHADOW }}
            title={t('idCard.verifiedSecurity')}
            aria-label={t('idCard.verifiedSecurity')}
          >
            <img
              src={brandAssets.logo}
              alt=""
              className="h-5 w-5 rounded-full object-cover opacity-90 md:h-6 md:w-6"
              crossOrigin="anonymous"
            />
            <ShieldCheck
              className="absolute -right-0.5 -top-0.5 h-3 w-3 text-forest-700 md:h-3.5 md:w-3.5"
              aria-hidden
              strokeWidth={2.5}
            />
          </div>
        </div>

        {/* QR — top-aligned with photo; label centered underneath */}
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
                className="h-[120px] w-[120px] max-md:h-[116px] max-md:w-[116px]"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center bg-forest-50 text-[10px] text-steel max-md:h-[116px] max-md:w-[116px]">
                QR
              </div>
            )}
          </div>
          <p className="max-w-[116px] text-center text-[9px] font-semibold uppercase leading-tight tracking-[0.1em] text-forest-800 md:max-w-none md:text-[10px] md:tracking-[0.12em]">
            {t('idCard.scanToVerify')}
          </p>
        </div>

        {/* Identity — more breathing room on mobile; values may wrap */}
        <div className="relative z-10 col-span-2 min-w-0 space-y-4 md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1 md:space-y-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
              {t('idCard.name')}
            </p>
            <p className="mt-1 text-lg font-bold leading-snug tracking-tight text-ink break-words md:truncate md:text-xl md:leading-tight lg:text-[22px]">
              {payload.fullName}
            </p>
          </div>

          <div className="rounded-lg border border-forest-100 bg-[#F7F8F6] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
              {t('idCard.volunteerId')}
            </p>
            <p className="mt-1 break-all font-mono text-[14px] font-bold tracking-wide text-forest-900 md:text-base">
              {payload.volunteerId}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5 md:gap-x-4 md:gap-y-3">
            <Field label={t('idCard.district')} value={payload.district} />
            <Field label={t('idCard.taluka')} value={payload.taluka} />
            <Field label={t('idCard.village')} value={payload.village} />
            <Field label={t('idCard.mobile')} value={payload.phoneDisplay} />
            <Field label={t('idCard.issued')} value={payload.issuedAtDisplay} />
            <Field label={t('idCard.appNo')} value={payload.applicationNumber} mono />
          </dl>
        </div>
      </div>

      {/* Dual authorization — continuous; roomier on mobile */}
      <div className="relative z-10 border-t border-forest-100 bg-[#FAFBFA] px-4 py-4 md:px-5 md:py-3.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:gap-6">
          <AuthorityBlock
            role={ROLE_FOUNDER}
            designation={ROLE_FOUNDER_DESIGNATION}
            signatureSrc={brandAssets.signature}
            signatureFit="width"
            name={t('idCard.authorizedName')}
            org={t('idCard.authorizedOrg')}
          />
          <AuthorityBlock
            role={ROLE_CO_FOUNDER}
            designation={ROLE_CO_FOUNDER_DESIGNATION}
            signatureSrc={brandAssets.signatureCoFounder}
            signatureFit="height"
            signatureRotateDeg={-8}
            name={t('idCard.authorizedNameCoFounder')}
            org={t('idCard.authorizedOrg')}
          />
        </div>
      </div>

      {/* Footer — stacks cleanly on narrow screens */}
      <div className="relative z-10 flex flex-col gap-1 border-t border-forest-100 bg-white px-4 py-2.5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-3 md:gap-y-1 md:px-5 md:py-2">
        <p className="text-[10px] font-medium leading-snug text-steel">
          {t('idCard.officialFooter')}
        </p>
        <p className="text-[10px] leading-snug text-steel">
          {t('idCard.issuedBy')}
          <span className="mx-1.5 text-mist">·</span>
          {t('idCard.version', { version: payload.version })}
        </p>
      </div>

      <div aria-hidden className="h-1 w-full bg-forest-900" />
    </div>
  )
})

/**
 * Authorization column — continuous with the card (no boxed outline).
 * Hierarchy: Role → signature → designation → NAME → org.
 * English role/designation on Marathi cards.
 */
function AuthorityBlock({
  role,
  designation,
  signatureSrc,
  signatureFit,
  signatureRotateDeg = 0,
  name,
  org,
}: {
  role: string
  designation: string
  signatureSrc: string
  signatureFit: 'width' | 'height'
  signatureRotateDeg?: number
  name: string
  org: string
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.1em] text-forest-800">
        {role}
      </p>

      {/* Mobile: slightly smaller signatures + tighter slot; md+: prior sizes */}
      <div className="mt-2 mb-0 flex h-[48px] items-end justify-start overflow-visible md:mt-1.5 md:h-[62px]">
        <img
          src={signatureSrc}
          alt=""
          className={cn(
            'object-contain object-left',
            signatureFit === 'width' &&
              'h-auto w-auto max-w-[105px] md:max-w-[122px]',
            signatureFit === 'height' &&
              'h-auto w-auto max-h-[52px] max-w-full md:max-h-[62px]',
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

      <p className="mt-2 font-sans text-[9px] font-medium leading-snug tracking-wide text-steel md:mt-1 md:text-[10px]">
        {designation}
      </p>
      <p className="mt-1 font-sans text-[10px] font-bold uppercase leading-snug tracking-wide text-ink break-words md:mt-0.5 md:truncate md:text-[12px]">
        {name}
      </p>
      <p className="mt-1 text-[10px] font-semibold leading-tight text-forest-800 md:mt-0.5">
        {org}
      </p>
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
    <div className="min-w-0 overflow-hidden">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-[13px] font-semibold leading-snug text-ink',
          /* Mobile: wrap long district/village names; md+: single-line truncate */
          'break-words hyphens-auto md:truncate md:hyphens-none',
          mono && 'font-mono tracking-wide break-all md:break-normal',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
