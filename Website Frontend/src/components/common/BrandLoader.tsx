import { motion, useReducedMotion } from 'framer-motion'

import { BrandLogo } from '@/components/common/BrandLogo'
import { useTranslation } from '@/i18n/LanguageProvider'

export function BrandLoader() {
  const { t } = useTranslation()
  const reduced = useReducedMotion() ?? false

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <BrandLogo size="xl" showLink={false} priority />
      </motion.div>
      <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
    </div>
  )
}
