import { Link } from 'react-router-dom'

import { FAQAccordion } from '@/components/FAQAccordion'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Button } from '@/components/ui/button'
import { faqItems } from '@/data/faq'
import { useTranslation } from '@/i18n/LanguageProvider'

export function FAQSection() {
  const { t } = useTranslation()
  const previewItems = faqItems.slice(0, 5)

  return (
    <section id="faq" className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.faq.eyebrow')}
          title={t('section.faq.title')}
          marathiTitle="वारंवार विचारले जाणारे प्रश्न"
          subtitle={t('section.faq.subtitle')}
        />

        <div className="mx-auto max-w-3xl">
          <FAQAccordion items={previewItems} defaultOpen={previewItems[0]?.id} />
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/faq">{t('section.faq.viewAll')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
