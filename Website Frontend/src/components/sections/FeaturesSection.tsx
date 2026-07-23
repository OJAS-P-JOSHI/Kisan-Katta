import { Link } from 'react-router-dom'

import { FeatureCard } from '@/components/cards/FeatureCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Button } from '@/components/ui/button'
import { features } from '@/data/features'
import { useTranslation } from '@/i18n/LanguageProvider'

export function FeaturesSection() {
  const { t, locale } = useTranslation()

  return (
    <section id="features" className="section-padding bg-cream">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.features.eyebrow')}
          title={t('section.features.title')}
          marathiTitle="शेतकऱ्याला लागणारी सर्व सुविधा"
          subtitle={t('section.features.subtitle')}
        />

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              title={locale === 'mr' ? t(feature.titleMrKey) : t(feature.titleKey)}
              titleMarathi={t(feature.titleMrKey)}
              description={t(feature.descriptionKey)}
              icon={feature.icon}
              index={index}
              locale={locale}
            />
          ))}
        </div>

        <div className="mt-10 text-center sm:mt-12">
          <Button asChild variant="outline" size="lg">
            <Link to="/features">{t('section.features.explore')}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
