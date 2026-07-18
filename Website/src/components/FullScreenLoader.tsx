import { motion } from 'framer-motion'

import { BrandLogo } from '@/components/common/BrandLogo'

interface FullScreenLoaderProps {
  message?: string
}

/**
 * Branded full-screen loader shown during login, OTP verification, user
 * loading, and session restoration.
 */
export function FullScreenLoader({ message = 'Loading…' }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-background">
      <div className="organic-blob absolute inset-0" aria-hidden />
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogo size="xl" showLink={false} priority />
      </motion.div>
      <p className="relative text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
