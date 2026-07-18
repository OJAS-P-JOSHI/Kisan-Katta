import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export type StepMeta = {
  title: string
  shortTitle: string
}

interface StepperProps {
  steps: StepMeta[]
  currentStep: number
  /** Steps considered complete (index-based). */
  completedSteps: number[]
  onStepClick?: (index: number) => void
}

/**
 * Horizontal progress stepper. Connector lines are aligned to the circle
 * centers; labels sit below and are hidden on very small screens.
 */
export function Stepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepperProps) {
  const lastIndex = steps.length - 1

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isComplete = completedSteps.includes(index)
          const isCurrent = index === currentStep
          const isClickable = Boolean(onStepClick) && (isComplete || index <= currentStep)
          // A connector segment is filled once the step to its left is done.
          const leftFilled = index > 0 && index <= currentStep
          const rightFilled = index < lastIndex && index < currentStep

          return (
            <li key={step.title} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    index === 0 ? 'bg-transparent' : leftFilled ? 'bg-forest-500' : 'bg-mist',
                  )}
                />
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${step.title}`}
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isCurrent && 'border-forest-900 bg-forest-900 text-white',
                    isComplete && !isCurrent && 'border-forest-500 bg-forest-500 text-white',
                    !isCurrent && !isComplete && 'border-mist bg-white text-steel',
                    isClickable && !isCurrent && 'hover:border-forest-500',
                    isClickable ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  {isComplete && !isCurrent ? <Check className="h-4 w-4" /> : index + 1}
                </button>
                <span
                  className={cn(
                    'h-0.5 flex-1 rounded-full transition-colors',
                    index === lastIndex ? 'bg-transparent' : rightFilled ? 'bg-forest-500' : 'bg-mist',
                  )}
                />
              </div>
              <span
                className={cn(
                  'mt-1.5 hidden max-w-full truncate px-1 text-[11px] font-medium sm:block',
                  isCurrent ? 'text-forest-900' : 'text-muted-foreground',
                )}
              >
                {step.shortTitle}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
