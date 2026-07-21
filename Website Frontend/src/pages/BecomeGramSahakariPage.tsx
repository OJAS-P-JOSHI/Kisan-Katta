import { motion } from 'framer-motion'
import {
  Award,
  BadgeCheck,
  Clock,
  GraduationCap,
  Heart,
  MapPin,
  Smartphone,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { PageHero } from '@/components/common/SectionTitle'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { CTASection } from '@/components/CTASection'
import { PageLayout } from '@/components/layout/PageLayout'
import { Timeline } from '@/components/Timeline'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  gramSahakariBenefits,
  gramSahakariTimelineSteps,
  villageImpactStats,
} from '@/data/gram-sahakari'
import { unsplash } from '@/data/images'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'

const benefitIcons = [Award, Heart, Users, BadgeCheck]

const requirements = [
  { icon: MapPin, text: 'Resident of Maharashtra with strong local village ties' },
  { icon: Smartphone, text: 'Own a smartphone and basic familiarity with mobile apps' },
  { icon: GraduationCap, text: 'Minimum education: 10th pass (preferred but not mandatory)' },
  { icon: Clock, text: 'Willing to dedicate 2–4 hours per week to helping farmers' },
  { icon: Heart, text: 'Passion for agriculture and community service' },
]

export function BecomeGramSahakariPage() {
  return (
    <PageLayout>
      <PageHero
        title="Become a Gram Sahakari"
        marathiTitle="ग्राम सहकारी बना"
        subtitle="Join our network of village volunteers empowering farmers across Maharashtra with digital tools."
      >
        <Button asChild size="lg" variant="secondary">
          <Link to="/contact">Start Application</Link>
        </Button>
      </PageHero>

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
          >
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Who is a Gram Sahakari?</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
              A Gram Sahakari is a trusted volunteer from your village or taluka who helps farmers
              install and use the Kisan Katta app. They are the human connection between technology
              and tradition — guiding farmers, answering questions, and ensuring every member of the
              community benefits from digital farming tools.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl shadow-card">
              <OptimizedImage
                src={unsplash.farmland}
                alt="Green farmland in Maharashtra"
                width={800}
                height={450}
                className="aspect-video w-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <h2 className="mb-5 text-2xl font-bold text-ink sm:text-3xl">Benefits</h2>
            <div className="space-y-3">
              {gramSahakariBenefits.map((benefit, index) => {
                const Icon = benefitIcons[index] ?? Award
                return (
                  <motion.div
                    key={benefit.title}
                    variants={fadeUp}
                    transition={{ ...defaultTransition, delay: index * 0.08 }}
                  >
                    <Card>
                      <CardContent className="flex gap-4 p-5 sm:p-6">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-600">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-ink">{benefit.title}</h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {benefit.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="mb-6 text-center text-2xl font-bold text-ink sm:mb-8 sm:text-3xl">
            Requirements
          </h2>
          <div className="mx-auto max-w-2xl space-y-3">
            {requirements.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-cream p-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[15px] text-slate sm:text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <h2 className="mb-8 text-center text-2xl font-bold text-ink sm:mb-10 sm:text-3xl">
            Village Impact
          </h2>
          <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4">
            {villageImpactStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-5 text-center shadow-soft sm:p-6"
              >
                <p className="text-2xl font-bold text-forest-900 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide">
          <h2 className="mb-8 text-center text-2xl font-bold text-ink sm:mb-10 sm:text-3xl">
            Application Process
          </h2>
          <Timeline steps={gramSahakariTimelineSteps} />
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link to="/contact">Start Application</Link>
            </Button>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to Make a Difference in Your Village?"
        description="Start your application today and join Maharashtra's growing network of Gram Sahakari volunteers."
        primaryLabel="Start Application"
        primaryHref="/contact"
      />
    </PageLayout>
  )
}
