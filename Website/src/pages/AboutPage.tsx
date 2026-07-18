import { motion } from 'framer-motion'
import { Heart, MapPin, Sprout, Users } from 'lucide-react'

import { PageHero } from '@/components/common/SectionTitle'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, CardContent } from '@/components/ui/card'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'

const values = [
  {
    icon: Sprout,
    title: 'Rooted in Agriculture',
    description:
      'We understand the soil, the seasons, and the struggles — because this platform was built alongside farmers.',
  },
  {
    icon: MapPin,
    title: 'Maharashtra First',
    description:
      'Every feature is localized for Maharashtra — 36 districts, Marathi language, and local mandi data.',
  },
  {
    icon: Users,
    title: 'Community Powered',
    description:
      'Our Gram Sahakari network and farmer community drive the platform forward, not algorithms in a distant office.',
  },
  {
    icon: Heart,
    title: 'Farmer Centric',
    description:
      'Free for farmers, simple to use, and designed for rural connectivity — because farming is hard enough.',
  },
]

export function AboutPage() {
  return (
    <PageLayout>
      <PageHero
        title="About Kisan Katta"
        marathiTitle="किसान कatta बद्दल"
        subtitle="A Maharashtra-born AgriTech platform on a mission to empower every farmer with technology that speaks their language."
      />

      <section className="section-padding bg-cream">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-lg leading-relaxed text-slate">
              Kisan Katta was born from a simple observation: Maharashtra&apos;s farmers have
              smartphones, but lack tools built for them. Existing apps are in English, focused on
              other states, or too complex for daily use.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-slate">
              We set out to change that — building a platform that delivers weather alerts, government
              mandi prices, community price insights, and a local marketplace, all in Marathi, all
              for Maharashtra.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 sm:grid-cols-2"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                variants={fadeUp}
                transition={{ ...defaultTransition, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                      <value.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-ink">{value.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
