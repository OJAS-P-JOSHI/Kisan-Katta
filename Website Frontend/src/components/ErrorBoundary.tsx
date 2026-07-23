import { Component, type ErrorInfo, type ReactNode } from 'react'

import { BrandLogo } from '@/components/common/BrandLogo'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render errors so the site never white-screens in production.
 * Copy is intentionally bilingual (EN + MR) because the language provider
 * may be outside or unavailable when this boundary renders.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  private handleReload = (): void => {
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
        <BrandLogo size="lg" />
        <h1 className="mt-8 text-2xl font-bold text-ink">Something went wrong</h1>
        <p className="font-marathi mt-1 text-sm text-forest-700">काहीतरी चुकले</p>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          An unexpected error occurred. Please return home and try again.
        </p>
        <Button className="mt-8" type="button" onClick={this.handleReload}>
          Return Home
        </Button>
      </div>
    )
  }
}
