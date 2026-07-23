import type { ReactNode } from 'react'

import { BrandLogo } from '@/components/common/BrandLogo'
import { AutoSaveIndicator } from '@/components/application/AutoSaveIndicator'
import { Stepper, type StepMeta } from '@/components/application/Stepper'
import type { SaveStatus } from '@/hooks/useAutoSave'
import { useTranslation } from '@/i18n/LanguageProvider'

interface WizardLayoutProps {
  steps: StepMeta[]
  currentStep: number
  completedSteps: number[]
  saveStatus: SaveStatus
  onStepClick?: (index: number) => void
  children: ReactNode
}

/** Full-page wizard frame: header, auto-save indicator, stepper, content slot. */
export function WizardLayout({
  steps,
  currentStep,
  completedSteps,
  saveStatus,
  onStepClick,
  children,
}: WizardLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-[100dvh] bg-background">
      <div className="organic-blob absolute inset-0" aria-hidden />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">{t('app.profile.title')}</p>
              <p className="font-marathi text-xs text-forest-700">{t('app.profile.marathi')}</p>
            </div>
          </div>
          <AutoSaveIndicator status={saveStatus} />
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-2xl border border-border/60 bg-white/70 p-4 shadow-soft backdrop-blur-sm sm:p-5">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={onStepClick}
          />
        </div>

        {children}
      </div>
    </div>
  )
}
