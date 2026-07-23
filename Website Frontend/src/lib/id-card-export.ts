import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

const CAPTURE_PIXEL_RATIO = 3

async function captureNode(node: HTMLElement): Promise<string> {
  // Wait a frame so fonts/images settle before rasterizing.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

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

  pdf.addImage(dataUrl, 'PNG', x, y, w, h, undefined, 'FAST')
  pdf.save(`${volunteerId}-gram-sahakari-id.pdf`)
}

export function printCard(node: HTMLElement, title: string): void {
  const clone = node.cloneNode(true) as HTMLElement
  clone.style.width = `${node.offsetWidth}px`
  clone.style.maxWidth = '100%'

  const win = window.open('', '_blank', 'noopener,noreferrer,width=720,height=900')
  if (!win) {
    // Popup blocked — fall back to printing the current page section.
    window.print()
    return
  }

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n')

  win.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${styles}
  <style>
    @page { margin: 12mm; }
    body {
      margin: 0;
      padding: 16px;
      background: #fff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      font-family: Poppins, system-ui, sans-serif;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  </style>
</head>
<body></body>
</html>`)
  win.document.close()
  win.document.body.appendChild(clone)

  const cleanup = () => {
    try {
      win.close()
    } catch {
      /* ignore */
    }
  }

  win.onafterprint = cleanup
  // Give images a moment to paint in the print window.
  window.setTimeout(() => {
    win.focus()
    win.print()
  }, 350)
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
      title: 'Gram Sahakari Digital ID',
      text: `Kisan Katta Gram Sahakari ID: ${volunteerId}`,
      files: [file],
      url: verificationUrl,
    })
    return 'shared'
  }

  if (nav.share) {
    await nav.share({
      title: 'Gram Sahakari Digital ID',
      text: `Kisan Katta Gram Sahakari ID: ${volunteerId}\n${verificationUrl}`,
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
