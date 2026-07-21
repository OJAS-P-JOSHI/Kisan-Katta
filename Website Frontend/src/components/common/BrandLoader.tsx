import { motion } from 'framer-motion'

import { BrandLogo } from '@/components/common/BrandLogo'

export function BrandLoader() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16">
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <BrandLogo size="xl" showLink={false} priority />
      </motion.div>
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
