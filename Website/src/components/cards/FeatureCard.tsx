import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

import { InteractiveCard } from '@/components/common/InteractiveCard'
import { Card, CardContent } from '@/components/ui/card'
import { defaultTransition, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  titleMarathi?: string
  className?: string
  index?: number
  locale?: 'en' | 'mr'
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  titleMarathi,
  className,
  index = 0,
  locale = 'en',
}: FeatureCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      transition={{ ...defaultTransition, delay: index * 0.08 }}
    >
      <InteractiveCard className={cn('h-full', className)}>
        <Card
          className={cn(
            'group h-full border-border/60 bg-white shadow-none transition-colors hover:border-forest-100',
          )}
        >
          <CardContent className="p-6 sm:p-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-700 transition-colors group-hover:bg-forest-700 group-hover:text-white">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className={cn('text-xl font-semibold text-ink', locale === 'mr' && 'font-marathi')}>
              {title}
            </h3>
            {titleMarathi && locale === 'en' && (
              <p className="font-marathi mt-1 text-sm text-forest-700">{titleMarathi}</p>
            )}
            <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </InteractiveCard>
    </motion.div>
  )
}
