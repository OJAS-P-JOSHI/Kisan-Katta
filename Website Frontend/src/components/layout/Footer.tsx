import { Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/common/BrandLogo'
import { contactInfo, footerLinks } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { cn } from '@/lib/utils'

function LinkColumn({
  heading,
  links,
}: {
  heading: string
  links: readonly { key: TranslationKeys; href: string }[]
}) {
  const { t, locale } = useTranslation()

  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">{heading}</h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.key}>
            <Link
              to={link.href}
              className={cn(
                'inline-flex min-h-10 items-center text-sm text-muted-foreground transition-colors hover:text-forest-900',
                locale === 'mr' && 'font-marathi',
              )}
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const { t, locale } = useTranslation()

  return (
    <footer className="border-t border-border bg-white">
      <div className="container-wide section-padding !py-12 sm:!py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandLogo size="lg" />
            <p
              className={cn(
                'mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground',
                locale === 'mr' && 'font-marathi',
              )}
            >
              {t('footer.tagline')}
            </p>
          </div>

          <LinkColumn heading={t('footer.company')} links={footerLinks.company} />
          <LinkColumn heading={t('footer.resources')} links={footerLinks.resources} />

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">
              {t('footer.support')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
                <a href={`tel:${contactInfo.phoneHref}`} className="hover:text-forest-900">
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="break-all hover:text-forest-900"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" aria-hidden />
                <address className="not-italic leading-relaxed">
                  {contactInfo.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
              <li className="text-sm text-muted-foreground">
                <p className="font-medium text-ink">{t('contact.hours')}</p>
                <p className="mt-0.5">
                  {t(contactInfo.hours.daysKey)} · {t(contactInfo.hours.timeKey)}
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 sm:mt-12 sm:pt-8">
          <p
            className={cn(
              'text-xs leading-relaxed text-muted-foreground',
              locale === 'mr' && 'font-marathi',
            )}
          >
            {t('footer.disclaimer')}
          </p>
          <div className="mt-6 flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
            <p>
              &copy; {Math.max(2026, new Date().getFullYear())} Kisan Katta. {t('footer.rights')}
            </p>
            <p className="font-marathi text-forest-700">{t('footer.forFarmers')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
