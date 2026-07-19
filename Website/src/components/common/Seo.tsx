import { useEffect } from 'react'

const SITE_NAME = 'Kisan Katta'
const DEFAULT_TITLE = 'Kisan Katta | Empowering Maharashtra Farmers'

interface SeoProps {
  title: string
  description?: string
  /** Path relative to origin, e.g. "/contact". Defaults to current path. */
  path?: string
}

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Lightweight, dependency-free SEO helper.
 * Updates the document title and the primary Open Graph / Twitter meta tags
 * for the page it is mounted on, then restores the default title on unmount.
 */
export function Seo({ title, description, path }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${path ?? window.location.pathname}`
        : path ?? ''

    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url)

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description)
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [title, description, path])

  return null
}
