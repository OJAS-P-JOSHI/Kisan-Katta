import { FeatureCard } from '@/components/cards/FeatureCard'
import { PageHero } from '@/components/common/SectionTitle'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { features } from '@/data/features'

export function FeaturesPage() {
  return (
    <PageLayout>
      <PageHero
        title="Features"
        marathiTitle="वैशिष्ट्ये"
        subtitle="Everything you need to farm smarter — from weather to marketplace, all in one app."
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                title={feature.title}
                titleMarathi={feature.titleMarathi}
                description={feature.description}
                icon={feature.icon}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Experience It Yourself"
        description="Download Kisan Katta and see how technology can transform your farming day."
        primaryLabel="Download App"
        primaryHref="#download"
        secondaryLabel="Learn About Gram Sahakari"
        secondaryHref="/become-gram-sahakari"
      />
    </PageLayout>
  )
}
