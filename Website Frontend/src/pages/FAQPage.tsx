import { PageIntro } from '@/components/common/SectionTitle'
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
      <PageIntro
        kicker={t('section.faq.eyebrow')}
        title={t('section.faq.title')}
        marathiTitle="वारंवार विचारले जाणारे प्रश्न"
        subtitle={t('section.faq.subtitle')}
      />

      <section className="section-padding !pt-8 bg-cream">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl">
            <FAQAccordion items={faqItems} defaultOpen={faqItems[0]?.id} />
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
