import { motion } from 'framer-motion'

import { defaultTransition, fadeUp, staggerContainer } from '@/lib/motion'
import type { TimelineStep } from '@/data/gram-sahakari'
import { cn } from '@/lib/utils'

interface TimelineProps {
  steps: TimelineStep[]
  className?: string
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={staggerContainer}
      className={cn('relative', className)}
    >
      {/* Desktop horizontal timeline */}
      <div className="hidden lg:block">
        <div className="relative flex items-start justify-between gap-2">
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-mist" />
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.08 }}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white shadow-card">
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-[calc(50%+24px)] h-0.5 w-[calc(100%-48px)] bg-forest-100" />
              )}
              <h4 className="mt-4 text-sm font-semibold text-ink">{step.title}</h4>
              <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile / tablet vertical timeline */}
      <div className="lg:hidden">
        <div className="relative space-y-8 pl-10">
          <div className="absolute bottom-0 left-[19px] top-0 w-0.5 bg-mist" />
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.06 }}
              className="relative"
            >
              <div className="absolute -left-10 flex h-10 w-10 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white shadow-soft">
                {index + 1}
              </div>
              <h4 className="text-base font-semibold text-ink">{step.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
