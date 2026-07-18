import { PageHero } from '@/components/common/SectionTitle'
import { FAQAccordion } from '@/components/FAQAccordion'
import { PageLayout } from '@/components/layout/PageLayout'
import { faqItems } from '@/data/faq'

export function FAQPage() {
  return (
    <PageLayout>
      <PageHero
        title="Frequently Asked Questions"
        marathiTitle="वारंवार विचारले जाणारे प्रश्न"
        subtitle="Find answers to common questions about Kisan Katta, the app, and the Gram Sahakari program."
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border/60 bg-white p-6 shadow-soft sm:p-10">
            <FAQAccordion items={faqItems} defaultOpen={faqItems[0]?.id} />
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
