import { Download } from 'lucide-react'
import { motion } from 'framer-motion'

import { Seo } from '@/components/common/Seo'
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
import { Button } from '@/components/ui/button'
import { appDownloadHref } from '@/data/site'
import { useTranslation } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp } from '@/lib/motion'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kisan Katta',
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
      <StatsSection />
      <AboutSection />
      <FeaturesSection />
      <WhyChooseSection />
      <GramSahakariSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />

      <section id="download" className="section-padding scroll-mt-24 bg-cream">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={defaultTransition}
          className="container-wide mx-auto max-w-2xl text-center"
        >
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">{t('download.title')}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{t('download.body')}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Button asChild size="lg" variant="glow">
              <a href={appDownloadHref}>
                <Download className="h-5 w-5" />
                {t('download.ctaLabel')}
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">{t('download.comingSoon')}</p>
          </div>
        </motion.div>
      </section>

      <CTASection
        title={t('landing.cta.title')}
        description={t('landing.cta.description')}
        primaryLabel={t('cta.becomeGramSahakari')}
        primaryHref="/become-gram-sahakari"
        secondaryLabel={t('hero.cta.download')}
        secondaryHref="/#download"
      />
    </PageLayout>
  )
}
