import type { ReactNode } from 'react'

import { PageIntro } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import {
  getLegalShell,
  getPrivacyDoc,
  getRefundDoc,
  getTermsDoc,
  type LegalBlock,
  type LegalDoc,
} from '@/data/legal-content'
import { contactInfo } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

function ContactList({ includeAddress }: { includeAddress?: boolean }) {
  const items: ReactNode[] = [
    <>
      Email:{' '}
      <a className="text-forest-700 underline" href={`mailto:${contactInfo.email}`}>
        {contactInfo.email}
      </a>
    </>,
    <>
      Phone:{' '}
      <a className="text-forest-700 underline" href={`tel:${contactInfo.phoneHref}`}>
        {contactInfo.phone}
      </a>
    </>,
  ]
  if (includeAddress) {
    items.push(<>Address: {contactInfo.address}</>)
  }
  return (
    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate marker:text-forest-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

function Block({
  block,
  includeAddressOnContact,
}: {
  block: LegalBlock
  includeAddressOnContact?: boolean
}) {
  switch (block.type) {
    case 'p':
      return <p>{block.text}</p>
    case 'pStrong':
      return (
        <p>
          {block.before}
          <strong>{block.strong}</strong>
          {block.after}
        </p>
      )
    case 'h3':
      return (
        <h3 className="mt-4 text-base font-semibold text-ink first:mt-0 sm:mt-6">
          {block.text}
        </h3>
      )
    case 'ul':
      return (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-slate marker:text-forest-700">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    case 'contact':
      return <ContactList includeAddress={includeAddressOnContact} />
    default:
      return null
  }
}

function LegalDocument({
  doc,
  includeAddressOnContact,
}: {
  doc: LegalDoc
  includeAddressOnContact?: boolean
}) {
  const { locale } = useTranslation()
  const shell = getLegalShell(locale)
  const marathi = locale === 'mr'

  return (
    <PageLayout>
      <Seo title={doc.title} description={doc.seoDescription} />
      <PageIntro title={doc.title} subtitle={doc.subtitle} />
      <section className="section-padding !pt-8 bg-cream">
        <div className="container-wide mx-auto max-w-2xl">
          <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
              {shell.versionLabel}
            </span>
            <span>
              {shell.lastUpdatedLabel}: {shell.lastUpdatedValue}
            </span>
          </div>
          <div className={cn('space-y-10', marathi && 'font-marathi')}>
            {doc.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-bold text-ink sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-slate">
                  {section.blocks.map((block, index) => (
                    <Block
                      key={`${section.title}-${index}`}
                      block={block}
                      includeAddressOnContact={includeAddressOnContact}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

export function PrivacyPage() {
  const { locale } = useTranslation()
  return (
    <LegalDocument
      doc={getPrivacyDoc(locale)}
      includeAddressOnContact
    />
  )
}

export function TermsPage() {
  const { locale } = useTranslation()
  return <LegalDocument doc={getTermsDoc(locale)} />
}

export function RefundPage() {
  const { locale } = useTranslation()
  return <LegalDocument doc={getRefundDoc(locale)} />
}
