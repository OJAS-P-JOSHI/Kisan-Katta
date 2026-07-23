import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Renders a QR data-URL for the given content (verification URL).
 * Errors resolve to null — card still renders without blocking.
 */
export function useQRDataUrl(content: string | null | undefined, size = 160): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!content) {
      setDataUrl(null)
      return
    }

    let cancelled = false
    void QRCode.toDataURL(content, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a4d2e', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [content, size])

  return dataUrl
}
