import { SectionTitle } from '@/components/common/SectionTitle'
import { Timeline } from '@/components/Timeline'
import { gramSahakariTimelineSteps } from '@/data/gram-sahakari'

export function HowItWorksSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow="Application Process"
          title="How It Works"
          marathiTitle="अर्ज प्रक्रिया"
          subtitle="From application to your first farmer onboarding — a simple, transparent journey for Gram Sahakari volunteers."
        />
        <Timeline steps={gramSahakariTimelineSteps} />
      </div>
    </section>
  )
}
