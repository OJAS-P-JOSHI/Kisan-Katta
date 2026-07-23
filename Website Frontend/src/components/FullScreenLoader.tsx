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
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background">
      <div className="organic-blob absolute inset-0" aria-hidden />
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative rounded-full shadow-lift ring-4 ring-white/70"
      >
        <BrandLogo size="xl" showLink={false} priority />
      </motion.div>
      <p className="relative text-sm font-medium tracking-tight text-muted-foreground">
        {message}
      </p>
    </div>
  )
}
