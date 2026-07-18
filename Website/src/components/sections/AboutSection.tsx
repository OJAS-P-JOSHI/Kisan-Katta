import { motion } from 'framer-motion'
import { Eye, Heart, Target } from 'lucide-react'

import { BrandCard } from '@/components/cards/BrandCard'
import { InteractiveCard } from '@/components/common/InteractiveCard'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/i18n/LanguageProvider'
import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'

const aboutCards = [
  {
    icon: Target,
    titleEn: 'Our Mission',
    titleMr: 'आमचे ध्येय',
    descriptionEn:
      'To empower every farmer in Maharashtra with accessible digital tools — weather, market data, and community — in their own language.',
    descriptionMr:
      'महाराष्ट्रातील प्रत्येक शेतकऱ्याला सुलभ डिजिटल साधने — हवामान, बाजार डेटा आणि समुदाय — त्यांच्या भाषेत उपलब्ध करून देणे.',
  },
  {
    icon: Eye,
    titleEn: 'Our Vision',
    titleMr: 'आमची दृष्टी',
    descriptionEn:
      'A digitally connected Maharashtra where every village farmer makes informed decisions and earns fair prices for their hard work.',
    descriptionMr:
      'डिजिटलरीत्या जोडलेले महाराष्ट्र जिथे प्रत्येक गावातील शेतकरी माहितीपूर्ण निर्णय घेतात आणि त्यांच्या मेहनतीचा योग्य मोबदला मिळवतात.',
  },
  {
    icon: Heart,
    titleEn: 'Why We Exist',
    titleMr: 'आम्ही का अस्तित्वात आहोत',
    descriptionEn:
      'Farmers deserve technology that respects their language, their land, and their livelihood. Kisan Katta was built for them, not for spreadsheets.',
    descriptionMr:
      'शेतकऱ्यांना अशी तंत्रज्ञानाची गरज आहे जी त्यांची भाषा, जमीन आणि उपजीविका यांचा आदर करते. किसान कatta त्यांच्यासाठी बांधले — स्प्रेडशीटसाठी नाही.',
  },
]

export function AboutSection() {
  const { t, locale } = useTranslation()

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-wide">
        <SectionTitle
          eyebrow={t('section.about.eyebrow')}
          title={t('section.about.title')}
          marathiTitle="किसान कatta बद्दल"
          subtitle={t('section.about.subtitle')}
        />

        <div className="mb-8 flex justify-center sm:mb-10 md:hidden">
          <BrandCard className="w-full max-w-xs" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid gap-5 sm:gap-6 md:grid-cols-3 md:gap-8"
        >
          {aboutCards.map((card, index) => (
            <motion.div
              key={card.titleEn}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.1 }}
            >
              <InteractiveCard className="h-full">
                <Card className="h-full border-border/60 bg-white shadow-none">
                  <CardContent className="p-6 text-center sm:p-8">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-600 sm:h-16 sm:w-16">
                      <card.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                    <h3
                      className={cn(
                        'text-xl font-semibold text-ink',
                        locale === 'mr' && 'font-marathi',
                      )}
                    >
                      {locale === 'mr' ? card.titleMr : card.titleEn}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {locale === 'mr' ? card.descriptionMr : card.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              </InteractiveCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
