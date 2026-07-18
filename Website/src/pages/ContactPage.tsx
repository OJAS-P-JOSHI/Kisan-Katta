import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { useState } from 'react'

import { PageHero } from '@/components/common/SectionTitle'
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
                Whether you&apos;re a farmer, a potential Gram Sahakari volunteer, or a partner — reach out and our
                team will respond within 24 hours.
              </p>
            </div>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-ink">Email</p>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-ink">Phone</p>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-muted-foreground hover:text-forest-700"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-ink">Address</p>
                  <p className="text-muted-foreground">{contactInfo.address}</p>
                </div>
              </li>
            </ul>
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
                    <Send className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-ink">Message Sent!</h3>
                  <p className="mt-2 text-muted-foreground">
                    Thank you for reaching out. We&apos;ll get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink">
                      Full Name
                    </label>
                    <Input id="name" placeholder="Your name" required />
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
                      Email
                    </label>
                    <Input id="email" type="email" placeholder="you@example.com" required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink">
                      Phone Number
                    </label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink">
                      Message
                    </label>
                    <textarea
                      id="message"
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
