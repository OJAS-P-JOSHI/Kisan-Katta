import { brandAssets } from '@/data/images'
import type { TranslationKeys } from '@/i18n/translations'

/**
 * Public founder profiles shown on /about.
 *
 * To add a co-founder later, append an entry (photo + bio keys required).
 * Do not add placeholder images or invented copy.
 */
export interface FounderProfile {
  id: string
  nameKey: TranslationKeys
  designationKey: TranslationKeys
  bioKey: TranslationKeys
  teaserBioKey: TranslationKeys
  highlightKey: TranslationKeys
  imageSrc: string
  imageAltKey: TranslationKeys
}

export const founders: FounderProfile[] = [
  {
    id: 'mahesh',
    nameKey: 'about.founder.mahesh.name',
    designationKey: 'about.founder.mahesh.designation',
    bioKey: 'about.founder.mahesh.bio',
    teaserBioKey: 'home.founder.mahesh.teaser',
    highlightKey: 'about.founder.highlight',
    imageSrc: brandAssets.founder,
    imageAltKey: 'about.founder.mahesh.imageAlt',
  },
]

/** Homepage teaser shows the first founder only. */
export const featuredFounder = founders[0]

export const founderEyebrowKey: TranslationKeys =
  founders.length > 1 ? 'about.founders.eyebrow' : 'about.founder.eyebrow'
