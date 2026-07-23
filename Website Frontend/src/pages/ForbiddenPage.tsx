import { Home } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Seo } from '@/components/common/Seo'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/button'

export function ForbiddenPage() {
  return (
    <PageLayout>
      <Seo title="403 · Access denied" description="You do not have permission." noindex />
      <section className="section-padding flex min-h-[70vh] items-center bg-[#F7F8F6]">
        <div className="container-wide mx-auto max-w-xl text-center">
          <p className="text-7xl font-bold text-forest-900 sm:text-8xl">403</p>
          <h1 className="mt-4 text-2xl font-bold text-ink sm:text-3xl">
            Access denied
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            You are signed in, but this account is not authorized to open the
            Admin Portal.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="h-5 w-5" />
                Go home
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/profile">Open profile</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
