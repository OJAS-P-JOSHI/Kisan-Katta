import { motion, useReducedMotion } from 'framer-motion'

import { FounderPortrait } from '@/components/founders/FounderPortrait'
import { FounderStoryCopy } from '@/components/founders/FounderStoryCopy'
import { founderEyebrowKey, founders, type FounderProfile } from '@/data/founders'
import { useTranslation } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'

function FounderProfileBlock({
  founder,
  showEyebrow,
}: {
  founder: FounderProfile
  showEyebrow: boolean
}) {
  const reduced = useReducedMotion() ?? false
  const headingId = `founder-${founder.id}-name`

  return (
    <motion.article
      initial={reduced ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={reduced ? undefined : staggerContainer}
      aria-labelledby={headingId}
      className="grid items-center gap-8 sm:gap-9 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-14 xl:gap-16"
    >
      <motion.div variants={reduced ? undefined : fadeUp} transition={defaultTransition}>
        <FounderPortrait founder={founder} size="about" />
      </motion.div>
      <motion.div variants={reduced ? undefined : fadeUp} transition={defaultTransition}>
        <FounderStoryCopy
          founder={founder}
          headingId={headingId}
          headingAs="h3"
          bioField="bioKey"
          showEyebrow={showEyebrow}
        />
      </motion.div>
    </motion.article>
  )
}

/**
 * Editorial founder introduction on /about.
 * Driven by `founders` so a second profile can be added without a layout rewrite.
 */
export function FounderSection() {
  const { t } = useTranslation()

  if (founders.length === 0) return null

  return (
    <div className="mt-14 overflow-x-clip border-t border-border/70 pt-12 sm:mt-16 sm:pt-14 md:mt-20">
      <h2 className="sr-only">{t(founderEyebrowKey)}</h2>
      <div className="space-y-16 sm:space-y-20">
        {founders.map((founder, index) => (
          <FounderProfileBlock
            key={founder.id}
            founder={founder}
            showEyebrow={index === 0}
          />
        ))}
      </div>
    </div>
  )
}
