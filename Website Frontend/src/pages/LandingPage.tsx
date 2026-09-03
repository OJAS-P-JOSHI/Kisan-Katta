import { Seo } from '@/components/common/Seo'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { FounderTeaserSection } from '@/components/sections/FounderTeaserSection'
import { GramSahakariSection } from '@/components/sections/GramSahakariSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { ProductShowcaseSection } from '@/components/sections/ProductShowcaseSection'
import { QuickFeaturesSection } from '@/components/sections/QuickFeaturesSection'
import { TrustStripSection } from '@/components/sections/TrustStripSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { appDownloadHref } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kissan Agrisathi',
  url: 'https://kisankatta.in',
  logo: 'https://kisankatta.in/web-app-manifest-512x512.png',
  description:
    "Maharashtra's AgriTech platform for weather, mandi prices, marketplace, and farmer community — in Marathi.",
}

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <Seo
        title={t('seo.home.title')}
        description={t('seo.home.description')}
        path="/"
        jsonLd={organizationJsonLd}
      />
      <HeroSection />
      <QuickFeaturesSection />
      <ProductShowcaseSection />
      <WhyChooseSection />
      <FounderTeaserSection />
      <GramSahakariSection />
      <TrustStripSection />
      <CTASection
        title={t('landing.cta.title')}
        description={t('landing.cta.description')}
        primaryLabel={t('cta.becomeGramSahakari')}
        primaryHref="/become-gram-sahakari"
        secondaryLabel={t('cta.downloadSoon')}
        secondaryHref={appDownloadHref}
      >
        <p
          id="download"
          className="mx-auto mt-4 max-w-md scroll-mt-28 text-sm leading-relaxed text-white/65"
        >
          {t('landing.cta.downloadNote')}
        </p>
      </CTASection>
    </PageLayout>
  )
}
