import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { FAQAccordion } from '@/components/FAQAccordion'
import { PageLayout } from '@/components/layout/PageLayout'
import { faqItems } from '@/data/faq'
import { useTranslation } from '@/i18n/LanguageProvider'

export function FAQPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo title={t('seo.faq.title')} description={t('seo.faq.description')} path="/faq" />
      <PageHero
        title={t('section.faq.title')}
        marathiTitle="वारंवार विचारले जाणारे प्रश्न"
        subtitle={t('section.faq.subtitle')}
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
