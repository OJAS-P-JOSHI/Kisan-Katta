import type { TranslationKeys } from '@/i18n/translations'

export interface TimelineStep {
  id: string
  titleKey: TranslationKeys
  descriptionKey: TranslationKeys
}

export const gramSahakariTimelineSteps: TimelineStep[] = [
  {
    id: 'apply',
    titleKey: 'become.timeline.apply.title',
    descriptionKey: 'become.timeline.apply.description',
  },
  {
    id: 'verification',
    titleKey: 'become.timeline.verification.title',
    descriptionKey: 'become.timeline.verification.description',
  },
  {
    id: 'profile',
    titleKey: 'become.timeline.profile.title',
    descriptionKey: 'become.timeline.profile.description',
  },
  {
    id: 'registration',
    titleKey: 'become.timeline.registration.title',
    descriptionKey: 'become.timeline.registration.description',
  },
  {
    id: 'approval',
    titleKey: 'become.timeline.approval.title',
    descriptionKey: 'become.timeline.approval.description',
  },
  {
    id: 'id-card',
    titleKey: 'become.timeline.idCard.title',
    descriptionKey: 'become.timeline.idCard.description',
  },
  {
    id: 'start',
    titleKey: 'become.timeline.start.title',
    descriptionKey: 'become.timeline.start.description',
  },
]

export const gramSahakariBenefits = [
  {
    titleKey: 'become.benefit.digitalId.title' as const,
    descriptionKey: 'become.benefit.digitalId.description' as const,
  },
  {
    titleKey: 'become.benefit.serve.title' as const,
    descriptionKey: 'become.benefit.serve.description' as const,
  },
  {
    titleKey: 'become.benefit.network.title' as const,
    descriptionKey: 'become.benefit.network.description' as const,
  },
  {
    titleKey: 'become.benefit.recognition.title' as const,
    descriptionKey: 'become.benefit.recognition.description' as const,
  },
]

export const gramSahakariResponsibilities: { textKey: TranslationKeys }[] = [
  { textKey: 'become.resp.install' },
  { textKey: 'become.resp.guide' },
  { textKey: 'become.resp.promote' },
  { textKey: 'become.resp.connect' },
  { textKey: 'become.resp.assist' },
]

export const villageImpactStats = [
  { labelKey: 'become.impact.farmers' as const, value: '150+' },
  { labelKey: 'become.impact.villages' as const, value: '500+' },
  { labelKey: 'become.impact.districts' as const, value: '36' },
]

export interface Testimonial {
  id: string
  nameKey: TranslationKeys
  roleKey: TranslationKeys
  locationKey: TranslationKeys
  quoteKey: TranslationKeys
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    nameKey: 'testimonial.1.name',
    roleKey: 'testimonial.1.role',
    locationKey: 'testimonial.1.location',
    quoteKey: 'testimonial.1.quote',
  },
  {
    id: '2',
    nameKey: 'testimonial.2.name',
    roleKey: 'testimonial.2.role',
    locationKey: 'testimonial.2.location',
    quoteKey: 'testimonial.2.quote',
  },
  {
    id: '3',
    nameKey: 'testimonial.3.name',
    roleKey: 'testimonial.3.role',
    locationKey: 'testimonial.3.location',
    quoteKey: 'testimonial.3.quote',
  },
]
