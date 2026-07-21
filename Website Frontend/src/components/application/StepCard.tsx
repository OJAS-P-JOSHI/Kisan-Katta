import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface StepCardProps {
  icon: LucideIcon
  title: string
  description?: string
  children: ReactNode
}

/** Glass container wrapping a single wizard step, with an entrance animation. */
export function StepCard({ icon: Icon, title, description, children }: StepCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="glass rounded-3xl p-5 shadow-card sm:p-7"
    >
      <header className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-forest-50 text-forest-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink sm:text-xl">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </header>

      <div className="space-y-5">{children}</div>
    </motion.section>
  )
}
