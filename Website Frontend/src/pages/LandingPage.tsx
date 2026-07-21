import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { AboutSection } from '@/components/sections/AboutSection'
import { FAQSection } from '@/components/sections/FAQSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { GramSahakariSection } from '@/components/sections/GramSahakariSection'
import { HeroSection } from '@/components/sections/HeroSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { QuickFeaturesSection } from '@/components/sections/QuickFeaturesSection'
import { StatsSection } from '@/components/sections/StatsSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { WhyChooseSection } from '@/components/sections/WhyChooseSection'
import { useTranslation } from '@/i18n/LanguageProvider'

export function LandingPage() {
  const { t } = useTranslation()

  return (
    <PageLayout>
      <HeroSection />
      <QuickFeaturesSection />
      <StatsSection />
      <AboutSection />
      <FeaturesSection />
      <WhyChooseSection />
      <GramSahakariSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <section id="download" aria-hidden className="scroll-mt-24" />
      <CTASection
        title={t('landing.cta.title')}
        description={t('landing.cta.description')}
        primaryLabel={t('cta.becomeGramSahakari')}
        primaryHref="/become-gram-sahakari"
        secondaryLabel={t('hero.cta.download')}
        secondaryHref="#download"
      />
    </PageLayout>
  )
}
