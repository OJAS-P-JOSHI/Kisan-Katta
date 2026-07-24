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

/** Display size for QR (~10% above prior 106). Generator still renders at 2×. */
const QR_DISPLAY_PX = 117

/**
 * Pure visual face of the Digital ID — captured for PNG/PDF/print.
 * Layout sections are fixed; this file only polishes visual craft.
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
      {/* Top brand bar — kept as the official issuing header */}
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

      {/* Body */}
      <div className="relative z-10 grid gap-5 p-5 sm:grid-cols-[112px_1fr]">
        {/* Subtle watermark — authenticity, never competes with content */}
        <img
          src={brandAssets.logo}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.038]"
          crossOrigin="anonymous"
        />

        {/* Photo + security mark */}
        <div className="relative z-10 mx-auto w-[112px] sm:mx-0">
          <div
            className="relative aspect-square overflow-hidden rounded-lg bg-forest-50"
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

          {/* Subtle security badge — corner of photo */}
          <div
            className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-forest-100 bg-white"
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

        {/* Identity fields — visual grid */}
        <div className="relative z-10 min-w-0 space-y-3.5">
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

      {/* Authorization + QR */}
      <div className="relative z-10 border-t border-forest-100 bg-[#FAFBFA] px-5 py-3.5">
        <div className="flex items-end justify-between gap-5">
          {/* Issuing authority — one connected block, tightened spacing */}
          <div className="min-w-0 flex-1 rounded-lg border border-forest-100/90 bg-white px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-steel">
              {t('idCard.authorizedBy')}
            </p>
            <img
              src={brandAssets.signature}
              alt=""
              width={144}
              height={50}
              className="mt-1 mb-0.5 h-auto w-[135px] max-w-full object-contain object-left opacity-[0.9] sm:w-[144px]"
              crossOrigin="anonymous"
              loading="eager"
              decoding="async"
            />
            <p className="text-[12px] font-semibold leading-tight text-ink">
              {t('idCard.authorizedName')}
            </p>
            <p className="mt-px text-[10px] leading-tight text-steel">
              {t('idCard.authorizedTitle')}
            </p>
            <p className="mt-px text-[10px] font-semibold leading-tight text-forest-800">
              {t('idCard.authorizedOrg')}
            </p>
          </div>

          {/* QR — primary verification element */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
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
                  className="h-[117px] w-[117px]"
                />
              ) : (
                <div className="flex h-[117px] w-[117px] items-center justify-center bg-forest-50 text-[10px] text-steel">
                  QR
                </div>
              )}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-forest-800">
              {t('idCard.scanToVerify')}
            </p>
          </div>
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
