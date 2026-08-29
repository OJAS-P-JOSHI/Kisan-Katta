import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PhoneFrameProps {
  children: ReactNode
  className?: string
  /** Accessible label for the device preview. */
  label?: string
}

/**
 * CSS phone chrome with a reserved 9:19 aspect ratio so screenshots or
 * Coming Soon placeholders never cause layout shift.
 */
export function PhoneFrame({ children, className, label }: PhoneFrameProps) {
  return (
    <div
      className={cn('relative mx-auto w-full max-w-[17.5rem] sm:max-w-[18.5rem]', className)}
      role="img"
      aria-label={label}
    >
      <div className="relative aspect-[9/19] overflow-hidden rounded-[2.15rem] bg-ink p-[9px] shadow-lift ring-1 ring-ink/40">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-[4.5rem] -translate-x-1/2 rounded-full bg-ink" />
        <div className="relative h-full w-full overflow-hidden rounded-[1.65rem] bg-cream">
          {children}
        </div>
      </div>
    </div>
  )
}
