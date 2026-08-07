import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

/** Internal capture scale — on-screen size unchanged; exports stay crisp at 400% / PVC print. */
const CAPTURE_PIXEL_RATIO = 3

/**
 * Wait until local images inside the card have decoded so exports stay sharp
 * (photo, logo, signature, QR).
 */
async function waitForImages(node: HTMLElement): Promise<void> {
  const images = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    images.map(async (img) => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode()
          return
        }
      } catch {
        /* decode can reject for broken URLs — fall through */
      }
      if (img.complete && img.naturalWidth > 0) return
      await new Promise<void>((resolve) => {
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
      })
    }),
  )
}

async function captureNode(node: HTMLElement): Promise<string> {
  await waitForImages(node)
  // Two frames so fonts/layout settle before rasterizing at 3×.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )

  return toPng(node, {
    cacheBust: true,
    pixelRatio: CAPTURE_PIXEL_RATIO,
    backgroundColor: '#ffffff',
    // Skip external stylesheets that can taint canvas in some browsers.
    filter: (el) => {
      if (el instanceof HTMLLinkElement && el.rel === 'stylesheet') return false
      return true
    },
  })
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadCardPng(node: HTMLElement, volunteerId: string): Promise<void> {
  const dataUrl = await captureNode(node)
  triggerDownload(dataUrl, `${volunteerId}-gram-sahakari-id.png`)
}

export async function downloadCardPdf(node: HTMLElement, volunteerId: string): Promise<void> {
  const dataUrl = await captureNode(node)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Failed to load card image'))
    img.src = dataUrl
  })

  // Card is ~ landscape credit-card-ish; fit to A4 with margins.
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 14
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2

  const ratio = Math.min(maxW / img.width, maxH / img.height)
  const w = img.width * ratio
  const h = img.height * ratio
  const x = (pageW - w) / 2
  const y = margin + 8

  // NONE = no recompression of the 3× PNG — sharpest PVC / laminate result.
  pdf.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'NONE')
  pdf.save(`${volunteerId}-gram-sahakari-id.pdf`)
}

export async function shareCard(
  node: HTMLElement,
  volunteerId: string,
  verificationUrl: string,
): Promise<'shared' | 'copied' | 'downloaded'> {
  const dataUrl = await captureNode(node)
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], `${volunteerId}-gram-sahakari-id.png`, { type: 'image/png' })

  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>
    canShare?: (data: ShareData) => boolean
  }

  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({
      title: 'Village Representative Digital ID',
      text: `Kissan Agrisathi Village Representative ID: ${volunteerId}`,
      files: [file],
      url: verificationUrl,
    })
    return 'shared'
  }

  if (nav.share) {
    await nav.share({
      title: 'Village Representative Digital ID',
      text: `Kissan Agrisathi Village Representative ID: ${volunteerId}\n${verificationUrl}`,
      url: verificationUrl,
    })
    return 'shared'
  }

  await navigator.clipboard.writeText(`${volunteerId}\n${verificationUrl}`)
  return 'copied'
}

export async function copyText(value: string): Promise<void> {
  await navigator.clipboard.writeText(value)
}
