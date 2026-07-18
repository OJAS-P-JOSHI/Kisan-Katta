import { useCallback, useState } from 'react'

import { uploadDocument } from '@/api/application.api'
import { getErrorMessage } from '@/lib/api-error'
import type { DocumentType, UploadDocumentResponse } from '@/types/application.types'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

/** Mirrors the backend upload constraints (`gram-sahakari.constants.ts`). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Client-side image validation to fail fast before hitting the network. */
export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, or WebP images are allowed.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return null
}

/**
 * Single-slot upload state (one instance per UploadCard). Supports progress,
 * retry (call `upload` again), and image validation.
 */
export function useDocumentUpload() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (
      documentType: DocumentType,
      file: File,
      onSuccess?: (result: UploadDocumentResponse) => void,
    ): Promise<UploadDocumentResponse | null> => {
      const validationError = validateImageFile(file)
      if (validationError) {
        setError(validationError)
        setStatus('error')
        return null
      }

      setStatus('uploading')
      setProgress(0)
      setError(null)

      try {
        const result = await uploadDocument(documentType, file, setProgress)
        setStatus('success')
        onSuccess?.(result)
        return result
      } catch (err) {
        setError(getErrorMessage(err, 'Upload failed. Please retry.'))
        setStatus('error')
        return null
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setError(null)
  }, [])

  return { status, progress, error, upload, reset }
}
