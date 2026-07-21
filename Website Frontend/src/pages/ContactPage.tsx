import { motion } from 'framer-motion'
import { Clock, Mail, MapPin, Phone, Send, Timer } from 'lucide-react'
import { useState } from 'react'

import { PageHero } from '@/components/common/SectionTitle'
import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { contactInfo } from '@/data/site'
import { fadeUp, defaultTransition } from '@/lib/motion'

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <PageLayout>
      <Seo
        title="Contact Us"
        description="Get in touch with the Kisan Katta team — call, email, or visit us. We're here to help farmers and Gram Sahakari volunteers across Maharashtra."
      />
      <PageHero
        title="Contact Us"
        marathiTitle="आमच्याशी संपर्क साधा"
        subtitle="Have questions about Kisan Katta or the Gram Sahakari program? We'd love to hear from you."
      />

      <section className="section-padding bg-cream">
        <div className="container-wide grid gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={defaultTransition}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-ink">Get in Touch</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Whether you&apos;re a farmer, a potential Gram Sahakari volunteer, or a partner —
                reach out and our team will respond as soon as possible.
              </p>
            </div>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">Business Address</p>
                  <address className="mt-0.5 not-italic leading-relaxed text-muted-foreground">
                    {contactInfo.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Phone className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">Phone</p>
                  <a
                    href={`tel:${contactInfo.phoneHref}`}
                    className="text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Mail className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">Email</p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="break-all text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">Business Hours</p>
                  <p className="text-muted-foreground">
                    {contactInfo.hours.days}
                    <br />
                    {contactInfo.hours.time}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Timer className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-medium text-ink">Typical Response Time</p>
                  <p className="text-muted-foreground">24–48 business hours</p>
                </div>
              </li>
            </ul>

            <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-card">
              <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 bg-forest-50 text-center text-forest-700">
                <MapPin className="h-8 w-8" aria-hidden />
                <p className="font-medium">Google Maps</p>
                <p className="max-w-xs px-4 text-sm text-forest-700/80">
                  Interactive map coming soon — Paithan, Chhatrapati Sambhajinagar, Maharashtra.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ ...defaultTransition, delay: 0.1 }}
          >
            <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-card">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                    <Send className="h-7 w-7" aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold text-ink">Coming Soon</h3>
                  <p className="mt-2 text-muted-foreground">
                    Online message submission is coming soon. In the meantime, please reach us
                    directly by phone or email above and we&apos;ll be happy to help.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
                      Name
                    </label>
                    <Input id="name" name="name" placeholder="Your name" required />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink">
                      Phone
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      placeholder="How can we help you?"
                      className="flex w-full rounded-xl border border-border bg-white px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  )
}
