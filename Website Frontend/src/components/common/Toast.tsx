import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-forest-100 bg-white text-forest-900',
  error: 'border-red-100 bg-white text-red-700',
  info: 'border-border bg-white text-ink',
}

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: CheckCircle2,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = ++idRef.current
      setItems((prev) => [...prev.slice(-2), { id, message, variant }])
      window.setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message) => toast(message, 'success'),
      error: (message) => toast(message, 'error'),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-end sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = VARIANT_ICON[item.variant]
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lift',
                  VARIANT_STYLES[item.variant],
                )}
                role="status"
              >
                <Icon
                  className={cn(
                    'mt-0.5 h-5 w-5 shrink-0',
                    item.variant === 'success' && 'text-forest-700',
                    item.variant === 'error' && 'text-red-500',
                    item.variant === 'info' && 'text-forest-700',
                  )}
                  aria-hidden
                />
                <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="touch-target -mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-forest-50 hover:text-ink"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
