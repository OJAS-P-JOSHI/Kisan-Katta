import { Leaf } from 'lucide-react'

import { OptimizedImage } from '@/components/common/OptimizedImage'
import type { FounderProfile } from '@/data/founders'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

type FounderPortraitSize = 'about' | 'teaser'

const sizeClass: Record<FounderPortraitSize, string> = {
  about: 'max-w-[13.75rem] sm:max-w-[16.5rem] lg:max-w-[20rem]',
  teaser: 'max-w-[10.75rem] sm:max-w-[12.5rem] lg:max-w-[15rem]',
}

interface FounderPortraitProps {
  founder: FounderProfile
  size?: FounderPortraitSize
  className?: string
}

/**
 * 3:4 editorial portrait. The source file is not cropped or background-stripped;
 * a warm cream mat and gold offset make the studio-white photograph feel intentional.
 */
export function FounderPortrait({ founder, size = 'about', className }: FounderPortraitProps) {
  const { t } = useTranslation()

  return (
    <figure className={cn('relative mx-auto w-full pr-2.5 pb-2.5 lg:mx-0', sizeClass[size], className)}>
      <div
        aria-hidden
        className="organic-blob pointer-events-none absolute -inset-5 hidden sm:block lg:-inset-8"
      />
      <Leaf
        aria-hidden
        strokeWidth={1.05}
        className="pointer-events-none absolute -left-4 -top-6 hidden h-24 w-24 rotate-[-18deg] text-forest-700/[0.11] sm:block sm:-left-6 sm:-top-8 sm:h-32 sm:w-32 lg:-left-7 lg:-top-9 lg:h-36 lg:w-36"
      />
      <div
        aria-hidden
        className="absolute right-0 bottom-0 h-[48%] w-[62%] rounded-[1.35rem] bg-gold-100 sm:h-[52%] sm:w-[68%] sm:rounded-[1.5rem]"
      />
      <div className="relative rounded-3xl bg-cream-dark p-1.5 shadow-soft sm:p-2.5">
        <div className="overflow-hidden rounded-[1.05rem] bg-cream sm:rounded-[1.15rem]">
          <OptimizedImage
            src={encodeURI(founder.imageSrc)}
            alt={t(founder.imageAltKey)}
            width={600}
            height={800}
            className="aspect-[3/4] w-full bg-cream object-cover object-top"
          />
        </div>
      </div>
    </figure>
  )
}
