import { useEffect } from 'react'

import { useTranslation } from '@/i18n/LanguageProvider'

const SITE_NAME = 'Kisan Katta'
const SITE_ORIGIN = 'https://kisankatta.in'
const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/web-app-manifest-512x512.png`
const DEFAULT_TITLE = 'Kisan Katta | Empowering Maharashtra Farmers'

interface SeoProps {
  title: string
  description?: string
  /** Path relative to origin, e.g. "/contact". Defaults to current path. */
  path?: string
  /** Comma-separated keywords. */
  keywords?: string
  /** Absolute image URL for Open Graph / Twitter. */
  image?: string
  /** Prevent indexing of auth / private pages. */
  noindex?: boolean
  /** Optional JSON-LD object (Organization, WebPage, FAQPage, etc.). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
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

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/**
 * Lightweight, dependency-free SEO helper.
 * Updates title, description, canonical, Open Graph, Twitter, robots, and optional JSON-LD.
 */
export function Seo({
  title,
  description,
  path,
  keywords,
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { locale } = useTranslation()

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    const pathname = path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
    const url = `${SITE_ORIGIN}${pathname}`

    upsertLink('canonical', url)
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url)
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image)
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
    upsertMeta(
      'meta[property="og:locale"]',
      'property',
      'og:locale',
      locale === 'mr' ? 'mr_IN' : 'en_IN',
    )
    upsertMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, nofollow' : 'index, follow',
    )

    if (description) {
      upsertMeta('meta[name="description"]', 'name', 'description', description)
      upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
      upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    }

    if (keywords) {
      upsertMeta('meta[name="keywords"]', 'name', 'keywords', keywords)
    }

    if (jsonLd) {
      upsertJsonLd('kk-jsonld', jsonLd)
    }

    return () => {
      document.title = DEFAULT_TITLE
      const script = document.getElementById('kk-jsonld')
      if (script) script.remove()
    }
  }, [title, description, path, keywords, image, noindex, jsonLd, locale])

  return null
}
