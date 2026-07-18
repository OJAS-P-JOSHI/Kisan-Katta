import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

import { InteractiveCard } from '@/components/common/InteractiveCard'
import { Card, CardContent } from '@/components/ui/card'
import { defaultTransition, fadeUp } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface TestimonialCardProps {
  name: string
  role: string
  location: string
  quote: string
  index?: number
  className?: string
}

export function TestimonialCard({
  name,
  role,
  location,
  quote,
  index = 0,
  className,
}: TestimonialCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      transition={{ ...defaultTransition, delay: index * 0.1 }}
    >
      <InteractiveCard className={cn('h-full', className)}>
        <Card className="h-full border-border/60 bg-white shadow-none">
          <CardContent className="flex h-full flex-col p-6 sm:p-8">
            <Quote className="mb-4 h-8 w-8 text-gold-500" />
            <p className="flex-1 leading-relaxed text-slate">&ldquo;{quote}&rdquo;</p>
            <div className="mt-6 border-t border-border pt-6">
              <p className="font-semibold text-ink">{name}</p>
              <p className="text-sm text-muted-foreground">
                {role} · {location}
              </p>
            </div>
          </CardContent>
        </Card>
      </InteractiveCard>
    </motion.div>
  )
}
