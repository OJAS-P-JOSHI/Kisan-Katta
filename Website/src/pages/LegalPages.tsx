import { PageHero } from '@/components/common/SectionTitle'
import { PageLayout } from '@/components/layout/PageLayout'

export function PrivacyPage() {
  return (
    <PageLayout>
      <PageHero title="Privacy Policy" subtitle="How Kisan Katta handles your data." />
      <section className="section-padding bg-cream">
        <div className="container-wide mx-auto max-w-3xl prose prose-slate">
          <p className="text-muted-foreground">
            Privacy policy content will be added here. This is a placeholder page for the website
            foundation.
          </p>
        </div>
      </section>
    </PageLayout>
  )
}

export function TermsPage() {
  return (
    <PageLayout>
      <PageHero title="Terms of Service" subtitle="Terms and conditions for using Kisan Katta." />
      <section className="section-padding bg-cream">
        <div className="container-wide mx-auto max-w-3xl">
          <p className="text-muted-foreground">
            Terms of service content will be added here. This is a placeholder page for the website
            foundation.
          </p>
        </div>
      </section>
    </PageLayout>
  )
}
