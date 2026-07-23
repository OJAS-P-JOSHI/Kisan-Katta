import { SectionTitle } from '@/components/common/SectionTitle'
import { Timeline } from '@/components/Timeline'
import { gramSahakariTimelineSteps } from '@/data/gram-sahakari'
import { useTranslation } from '@/i18n/LanguageProvider'

export function HowItWorksSection() {
  const { t } = useTranslation()

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.howItWorks.eyebrow')}
          title={t('section.howItWorks.title')}
          marathiTitle={t('section.howItWorks.marathiTitle')}
          subtitle={t('section.howItWorks.subtitle')}
        />
        <Timeline steps={gramSahakariTimelineSteps} />
      </div>
    </section>
  )
}
