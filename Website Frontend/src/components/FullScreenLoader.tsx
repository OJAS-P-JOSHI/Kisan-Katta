import { motion, useReducedMotion } from 'framer-motion'

import { BrandLogo } from '@/components/common/BrandLogo'

interface FullScreenLoaderProps {
  message?: string
}

/**
 * Branded full-screen loader shown during login, OTP verification, user
 * loading, and session restoration. Presentation only — callers unchanged.
 */
export function FullScreenLoader({ message = 'Loading…' }: FullScreenLoaderProps) {
  const reduced = useReducedMotion() ?? false

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-cream">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <BrandLogo size="xl" showLink={false} priority />
      </motion.div>
      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 0.12, duration: 0.3 }}
        className="text-sm font-medium tracking-tight text-muted-foreground"
      >
        {message}
      </motion.p>
    </div>
  )
}
