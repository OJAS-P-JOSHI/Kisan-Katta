import { TestimonialCard } from '@/components/cards/TestimonialCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { testimonials } from '@/data/gram-sahakari'
import { useTranslation } from '@/i18n/LanguageProvider'

export function TestimonialsSection() {
  const { t } = useTranslation()

  return (
    <section className="section-padding bg-cream">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.testimonials.eyebrow')}
          title={t('section.testimonials.title')}
          marathiTitle={t('section.testimonials.marathiTitle')}
          subtitle={t('section.testimonials.subtitle')}
        />

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              name={t(testimonial.nameKey)}
              role={t(testimonial.roleKey)}
              location={t(testimonial.locationKey)}
              quote={t(testimonial.quoteKey)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
