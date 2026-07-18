import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

import type { SaveStatus } from '@/hooks/useAutoSave'
import { cn } from '@/lib/utils'

const CONFIG: Record<
  SaveStatus,
  { label: string; className: string; icon: typeof Check | null }
> = {
  idle: { label: 'All changes saved', className: 'text-muted-foreground', icon: null },
  saving: { label: 'Saving…', className: 'text-forest-700', icon: Loader2 },
  saved: { label: 'Saved', className: 'text-forest-700', icon: Check },
  error: { label: 'Save failed — retrying on next change', className: 'text-red-600', icon: AlertCircle },
}

export function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  const config = CONFIG[status]
  const Icon = config.icon

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.2 }}
        className={cn('flex items-center gap-1.5 text-xs font-medium', config.className)}
      >
        {Icon && <Icon className={cn('h-3.5 w-3.5', status === 'saving' && 'animate-spin')} />}
        {config.label}
      </motion.div>
    </AnimatePresence>
  )
}
