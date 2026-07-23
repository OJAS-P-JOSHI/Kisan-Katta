import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

import type { SaveStatus } from '@/hooks/useAutoSave'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { TranslationKeys } from '@/i18n/translations'
import { cn } from '@/lib/utils'

const CONFIG: Record<
  SaveStatus,
  { labelKey: TranslationKeys; className: string; icon: typeof Check | null }
> = {
  idle: { labelKey: 'app.autosave.idle', className: 'text-muted-foreground', icon: null },
  saving: { labelKey: 'app.autosave.saving', className: 'text-forest-700', icon: Loader2 },
  saved: { labelKey: 'app.autosave.saved', className: 'text-forest-700', icon: Check },
  error: {
    labelKey: 'app.autosave.error',
    className: 'text-red-600',
    icon: AlertCircle,
  },
}

export function AutoSaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useTranslation()
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
        {t(config.labelKey)}
      </motion.div>
    </AnimatePresence>
  )
}
