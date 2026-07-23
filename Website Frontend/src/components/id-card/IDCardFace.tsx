import { UserRound } from 'lucide-react'
import { forwardRef } from 'react'

import { brandAssets } from '@/data/images'
import { useQRDataUrl } from '@/hooks/useQRDataUrl'
import { useTranslation } from '@/i18n/LanguageProvider'
import { buildQRContent, type IDCardPayload } from '@/lib/gram-sahakari-id'
import { cn } from '@/lib/utils'

interface IDCardFaceProps {
  payload: IDCardPayload
  className?: string
}

/**
 * Pure visual face of the Digital ID — captured for PNG/PDF/print.
 * Keep layout self-contained (inline-friendly colors) for clean exports.
 */
export const IDCardFace = forwardRef<HTMLDivElement, IDCardFaceProps>(function IDCardFace(
  { payload, className },
  ref,
) {
  const { t } = useTranslation()
  const qrContent = buildQRContent(payload)
  const qrDataUrl = useQRDataUrl(qrContent, 112)

  return (
    <div
      ref={ref}
      className={cn(
        'relative w-full overflow-hidden rounded-2xl border border-forest-100 bg-white text-left shadow-lift',
        className,
      )}
      style={{
        backgroundImage:
          'linear-gradient(155deg, #ffffff 0%, #f7faf4 48%, #edf4e8 100%)',
      }}
    >
      {/* Top brand bar */}
      <div className="relative flex items-center gap-3 border-b border-forest-100/80 bg-gradient-to-r from-forest-900 to-forest-700 px-4 py-3.5 sm:px-5">
        <img
          src={brandAssets.logo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-full bg-white object-cover shadow-soft ring-2 ring-white/30"
          crossOrigin="anonymous"
        />
        <div className="min-w-0 flex-1 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-100">
            Kisan Katta
          </p>
          <h2 className="truncate text-sm font-bold leading-tight sm:text-base">
            {t('idCard.title')}
          </h2>
          <p className="text-[11px] text-white/75">{t('idCard.subtitle')}</p>
        </div>
        <span className="shrink-0 rounded-full bg-forest-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-800 ring-1 ring-white/40">
          {t('idCard.active')}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[112px_1fr] sm:gap-5 sm:p-5">
        {/* Photo */}
        <div className="mx-auto w-[112px] sm:mx-0">
          <div className="aspect-square overflow-hidden rounded-xl border border-forest-100 bg-forest-50 shadow-soft">
            {payload.photoUrl ? (
              <img
                src={payload.photoUrl}
                alt=""
                className="h-full w-full object-cover"
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
        </div>

        {/* Identity fields */}
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('idCard.name')}
            </p>
            <p className="truncate text-lg font-bold tracking-tight text-ink sm:text-xl">
              {payload.fullName}
            </p>
          </div>

          <div className="rounded-xl border border-forest-100/80 bg-white/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('idCard.volunteerId')}
            </p>
            <p className="font-mono text-sm font-bold tracking-wide text-forest-900 sm:text-base">
              {payload.volunteerId}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-sm">
            <Field label={t('idCard.district')} value={payload.district} />
            <Field label={t('idCard.taluka')} value={payload.taluka} />
            <Field label={t('idCard.village')} value={payload.village} />
            <Field label={t('idCard.mobile')} value={payload.phoneDisplay} />
            <Field label={t('idCard.issued')} value={payload.issuedAtDisplay} />
            <Field label={t('idCard.appNo')} value={payload.applicationNumber} mono />
          </dl>
        </div>
      </div>

      {/* Footer: QR + verify meta */}
      <div className="flex items-end justify-between gap-3 border-t border-forest-100/80 bg-white/60 px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('idCard.verify')}
          </p>
          <p className="break-all font-mono text-[10px] leading-relaxed text-forest-800/90 sm:text-[11px]">
            {payload.verificationUrl}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t('idCard.version', { version: payload.version })}
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-forest-100 bg-white p-1.5 shadow-soft">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="" width={96} height={96} className="h-24 w-24" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center bg-forest-50 text-[10px] text-muted-foreground">
              QR
            </div>
          )}
        </div>
      </div>

      {/* Subtle authenticity strip */}
      <div
        aria-hidden
        className="h-1.5 w-full bg-gradient-to-r from-forest-900 via-gold-500 to-forest-700"
      />
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
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'truncate text-[13px] font-semibold text-ink',
          mono && 'font-mono tracking-wide',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
