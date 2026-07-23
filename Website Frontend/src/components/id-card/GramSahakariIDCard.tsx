import {
  Copy,
  Download,
  FileText,
  Loader2,
  Printer,
  Share2,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { IDCardFace } from '@/components/id-card/IDCardFace'
import { useToast } from '@/components/common/Toast'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/LanguageProvider'
import {
  buildIDCardPayload,
  isIDCardEligible,
} from '@/lib/gram-sahakari-id'
import {
  copyText,
  downloadCardPdf,
  downloadCardPng,
  printCard,
  shareCard,
} from '@/lib/id-card-export'
import type { ApplicationDTO } from '@/types/application.types'
import { cn } from '@/lib/utils'

type BusyAction = 'png' | 'pdf' | 'print' | 'share' | 'copy' | null

interface GramSahakariIDCardProps {
  application: ApplicationDTO
  className?: string
  /** When false, skip the section heading (e.g. embedded layouts). */
  showHeading?: boolean
}

/**
 * Reusable Digital Gram Sahakari ID Card.
 *
 * Security: renders nothing unless status=SUBMITTED and paymentStatus=PAID.
 * Safe to mount on Status, Success, and future Profile pages.
 */
export function GramSahakariIDCard({
  application,
  className,
  showHeading = true,
}: GramSahakariIDCardProps) {
  const { t, locale } = useTranslation()
  const { success, error: toastError } = useToast()
  const cardRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState<BusyAction>(null)

  const payload = isIDCardEligible(application)
    ? buildIDCardPayload(application, locale)
    : null

  const run = useCallback(
    async (action: Exclude<BusyAction, null>, fn: () => Promise<void> | void) => {
      if (busy || !cardRef.current || !payload) return
      setBusy(action)
      try {
        await fn()
      } catch {
        toastError(t('idCard.actionFailed'))
      } finally {
        setBusy(null)
      }
    },
    [busy, payload, t, toastError],
  )

  if (!payload) return null

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label={t('idCard.sectionTitle')}
    >
      {showHeading && (
        <div>
          <h2 className="text-base font-bold text-ink sm:text-lg">{t('idCard.sectionTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('idCard.sectionSubtitle')}</p>
        </div>
      )}

      <IDCardFace ref={cardRef} payload={payload} />

      <div className="flex flex-wrap gap-2">
        <ActionButton
          label={t('idCard.downloadPng')}
          busy={busy === 'png'}
          disabled={Boolean(busy)}
          icon={Download}
          onClick={() =>
            void run('png', async () => {
              await downloadCardPng(cardRef.current!, payload.volunteerId)
              success(t('idCard.downloadedPng'))
            })
          }
        />
        <ActionButton
          label={t('idCard.downloadPdf')}
          busy={busy === 'pdf'}
          disabled={Boolean(busy)}
          icon={FileText}
          onClick={() =>
            void run('pdf', async () => {
              await downloadCardPdf(cardRef.current!, payload.volunteerId)
              success(t('idCard.downloadedPdf'))
            })
          }
        />
        <ActionButton
          label={t('idCard.print')}
          busy={busy === 'print'}
          disabled={Boolean(busy)}
          icon={Printer}
          variant="outline"
          onClick={() =>
            void run('print', () => {
              printCard(cardRef.current!, t('idCard.title'))
            })
          }
        />
        <ActionButton
          label={t('idCard.share')}
          busy={busy === 'share'}
          disabled={Boolean(busy)}
          icon={Share2}
          variant="outline"
          onClick={() =>
            void run('share', async () => {
              const result = await shareCard(
                cardRef.current!,
                payload.volunteerId,
                payload.verificationUrl,
              )
              if (result === 'copied') success(t('idCard.shareCopied'))
              else success(t('idCard.shared'))
            })
          }
        />
        <ActionButton
          label={t('idCard.copyId')}
          busy={busy === 'copy'}
          disabled={Boolean(busy)}
          icon={Copy}
          variant="outline"
          onClick={() =>
            void run('copy', async () => {
              await copyText(payload.volunteerId)
              success(t('idCard.copied'))
            })
          }
        />
      </div>
    </section>
  )
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  busy,
  disabled,
  variant = 'default',
}: {
  label: string
  icon: typeof Download
  onClick: () => void
  busy: boolean
  disabled: boolean
  variant?: 'default' | 'outline'
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className="min-h-10"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
      {label}
    </Button>
  )
}
