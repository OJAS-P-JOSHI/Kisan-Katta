import { FeatureCard } from '@/components/cards/FeatureCard'
import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { features } from '@/data/features'
import { useTranslation } from '@/i18n/LanguageProvider'

export function FeaturesPage() {
  const { t, locale } = useTranslation()

  return (
    <PageLayout>
      <Seo title={t('seo.features.title')} description={t('seo.features.description')} path="/features" />
      <PageHero
        title={t('featuresPage.heroTitle')}
        marathiTitle={t('featuresPage.heroMarathi')}
        subtitle={t('featuresPage.heroSubtitle')}
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      <CTASection
        title={t('featuresPage.ctaTitle')}
        description={t('featuresPage.ctaDescription')}
        primaryLabel={t('featuresPage.ctaDownload')}
        primaryHref="/#download"
        secondaryLabel={t('featuresPage.ctaGram')}
        secondaryHref="/become-gram-sahakari"
      />
    </PageLayout>
  )
}
