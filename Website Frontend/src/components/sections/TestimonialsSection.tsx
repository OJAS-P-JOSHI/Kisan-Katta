import { TestimonialCard } from '@/components/cards/TestimonialCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { testimonials } from '@/data/gram-sahakari'

export function TestimonialsSection() {
  return (
    <section className="section-padding bg-cream">
      <div className="container-wide">
        <SectionTitle
          eyebrow="Testimonials"
          title="Voices from the Field"
          marathiTitle="शेतातून आलेले अनुभव"
          subtitle="Stories from farmers and Gram Sahakari volunteers across Maharashtra."
        />

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              name={testimonial.name}
              role={testimonial.role}
              location={testimonial.location}
              quote={testimonial.quote}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
