import { Globe, Mail, MapPin, MessageCircle, Phone, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandLogo } from '@/components/common/BrandLogo'
import { contactInfo, footerLinks } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

const socialLinks = [
  { icon: Share2, href: '#', label: 'Facebook' },
  { icon: Globe, href: '#', label: 'Instagram' },
  { icon: MessageCircle, href: '#', label: 'Twitter' },
  { icon: Mail, href: '#', label: 'LinkedIn' },
] as const

export function Footer() {
  const { t, locale } = useTranslation()

  return (
    <footer className="border-t border-border bg-white">
      <div className="container-wide section-padding !py-12 sm:!py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
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
            <div className="mt-5 flex gap-2.5">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="touch-target flex items-center justify-center rounded-xl bg-forest-50 text-forest-700 transition-colors hover:bg-forest-900 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">
              {t('footer.quickLinks')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
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

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">
              {t('footer.support')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
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

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
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

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink sm:mb-4">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                <a href={`mailto:${contactInfo.email}`} className="hover:text-forest-900">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                <a href={`tel:${contactInfo.phone}`} className="hover:text-forest-900">
                  {contactInfo.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                <span>{contactInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground sm:mt-12 sm:pt-8">
          <p>
            &copy; {new Date().getFullYear()} Kisan Katta. {t('footer.rights')}
          </p>
          <p className={cn('mt-1 text-forest-700', locale === 'mr' ? 'font-marathi' : 'font-marathi')}>
            {t('footer.forFarmers')}
          </p>
        </div>
      </div>
    </footer>
  )
}
