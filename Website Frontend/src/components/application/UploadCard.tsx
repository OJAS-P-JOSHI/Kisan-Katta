import { AlertCircle, RotateCcw, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

import { DocumentPreview } from '@/components/application/DocumentPreview'
import { useDocumentUpload } from '@/hooks/useDocumentUpload'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'
import type {
  CloudinaryDocument,
  DocumentType,
  UploadDocumentResponse,
} from '@/types/application.types'

interface UploadCardProps {
  label: string
  description?: string
  documentType: DocumentType
  /** Currently persisted document, if any. */
  document: CloudinaryDocument | null
  required?: boolean
  onUploaded: (result: UploadDocumentResponse) => void
}

/**
 * Single document slot modelled as a strict state machine. Exactly one visual
 * state is shown at a time:
 *   uploading → progress only
 *   error     → error + retry (previous thumbnail shown WITHOUT an "Uploaded" badge)
 *   uploaded  → thumbnail + "Uploaded" badge + Replace
 *   idle      → dropzone
 * "Uploaded" and "Retry" can never appear together.
 */
export function UploadCard({
  label,
  description,
  documentType,
  document,
  required,
  onUploaded,
}: UploadCardProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const { status, progress, error, upload } = useDocumentUpload()
  const [lastFile, setLastFile] = useState<File | null>(null)

  const isUploading = status === 'uploading'
  const isError = status === 'error'
  const hasDoc = Boolean(document)

  const startUpload = (file: File): void => {
    setLastFile(file)
    void upload(documentType, file, onUploaded)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) startUpload(file)
    e.target.value = ''
  }

  const retry = (): void => {
    if (lastFile) startUpload(lastFile)
    else inputRef.current?.click()
  }

  const openPicker = (): void => inputRef.current?.click()

  const showReplace = hasDoc && !isUploading

  return (
    <div className="rounded-2xl border border-border bg-white/70 p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {showReplace && (
          <button
            type="button"
            onClick={openPicker}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-forest-700 transition-colors hover:bg-forest-50"
          >
            {t('app.upload.replace')}
          </button>
        )}
      </div>

      {/* Exactly one primary state */}
      {isUploading ? (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
            <div
              className="h-full rounded-full bg-forest-500 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t('app.upload.uploading')} {progress}%
          </p>
        </div>
      ) : hasDoc ? (
        <DocumentPreview url={document!.url} alt={label} showBadge={!isError} />
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-cream/50 px-4 py-8 text-center transition-colors hover:border-forest-500 hover:bg-forest-50',
            isError ? 'border-red-300' : 'border-border',
          )}
        >
          <Upload className="h-6 w-6 text-forest-700" />
          <span className="text-sm font-medium text-slate">{t('app.upload.tap')}</span>
          <span className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</span>
        </button>
      )}

      {/* Error banner (never rendered together with the "Uploaded" badge) */}
      {isError && error && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={retry}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('app.upload.retry')}
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
