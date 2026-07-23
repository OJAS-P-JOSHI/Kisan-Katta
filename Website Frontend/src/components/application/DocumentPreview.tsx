import { FileCheck2 } from 'lucide-react'

import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface DocumentPreviewProps {
  url: string
  alt: string
  className?: string
  /** Show the green "Uploaded" badge (only when the file is persisted). */
  showBadge?: boolean
}

/** Thumbnail preview of an uploaded document image. */
export function DocumentPreview({
  url,
  alt,
  className,
  showBadge = true,
}: DocumentPreviewProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-cream',
        className,
      )}
    >
      <img src={url} alt={alt} className="h-36 w-full object-contain" loading="lazy" />
      {showBadge && (
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-forest-900/90 px-2 py-0.5 text-[10px] font-semibold text-white">
          <FileCheck2 className="h-3 w-3" />
          {t('app.review.uploaded')}
        </span>
      )}
    </div>
  )
}
