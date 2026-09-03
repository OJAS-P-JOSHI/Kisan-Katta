import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { founderEyebrowKey, type FounderProfile } from '@/data/founders'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface FounderStoryCopyProps {
  founder: FounderProfile
  headingId: string
  headingAs?: 'h2' | 'h3'
  bioField?: 'bioKey' | 'teaserBioKey'
  showEyebrow?: boolean
  showCta?: boolean
  compact?: boolean
}

export function FounderStoryCopy({
  founder,
  headingId,
  headingAs = 'h3',
  bioField = 'bioKey',
  showEyebrow = true,
  showCta = false,
  compact = false,
}: FounderStoryCopyProps) {
  const { t, locale } = useTranslation()
  const marathi = locale === 'mr'
  const Heading = headingAs

  return (
    <div className="mx-auto min-w-0 max-w-xl text-center lg:mx-0 lg:text-left">
      {showEyebrow && (
        <span className="mb-3 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-forest-700">
          {t(founderEyebrowKey)}
        </span>
      )}
      <Heading
        id={headingId}
        className={cn(
          'font-bold leading-snug tracking-tight text-balance text-ink',
          compact
            ? 'text-[1.3rem] sm:text-2xl md:text-[1.75rem]'
            : 'text-[1.4rem] sm:text-3xl',
        )}
      >
        {t(founder.nameKey)}
      </Heading>
      <p className="mt-1.5 text-sm font-medium text-forest-700 sm:text-[15px]">
        {t(founder.designationKey)}
      </p>
      <p
        className={cn(
          'mt-5 text-[15px] leading-relaxed text-slate sm:text-base',
          marathi && 'font-marathi',
        )}
      >
        {t(founder[bioField])}
      </p>
      <blockquote
        className={cn(
          'mt-5 border-l-2 border-forest-700 pl-4 text-left text-[15px] leading-relaxed text-ink sm:text-base',
          marathi && 'font-marathi',
        )}
      >
        {t(founder.highlightKey)}
      </blockquote>
      {showCta && (
        <div className="mt-6 flex justify-center lg:justify-start">
          <Button asChild variant="outline">
            <Link to="/about">
              {t('home.founder.cta')}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
