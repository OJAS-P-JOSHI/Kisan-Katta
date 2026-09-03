import { motion, useReducedMotion } from 'framer-motion'

import { FounderPortrait } from '@/components/founders/FounderPortrait'
import { FounderStoryCopy } from '@/components/founders/FounderStoryCopy'
import { featuredFounder } from '@/data/founders'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'

/**
 * Compact homepage teaser. Uses the same founder data as /about.
 * Shows only the featured (first) founder — do not map the full list here.
 */
export function FounderTeaserSection() {
  const reduced = useReducedMotion() ?? false
  const founder = featuredFounder

  if (!founder) return null

  const headingId = `home-founder-${founder.id}-name`

  return (
    <section className="section-padding bg-white" aria-labelledby={headingId}>
      <div className="container-wide overflow-x-clip">
        <motion.article
          initial={reduced ? false : 'hidden'}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={reduced ? undefined : staggerContainer}
          className="grid items-center gap-7 sm:gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12 xl:gap-14"
        >
          <motion.div variants={reduced ? undefined : fadeUp} transition={defaultTransition}>
            <FounderPortrait founder={founder} size="teaser" />
          </motion.div>
          <motion.div variants={reduced ? undefined : fadeUp} transition={defaultTransition}>
            <FounderStoryCopy
              founder={founder}
              headingId={headingId}
              headingAs="h2"
              bioField="teaserBioKey"
              showCta
              compact
            />
          </motion.div>
        </motion.article>
      </div>
    </section>
  )
}
