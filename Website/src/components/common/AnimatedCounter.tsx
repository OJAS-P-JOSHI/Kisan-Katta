import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  className?: string
  duration?: number
}

export function AnimatedCounter({
  value,
  suffix = '',
  className,
  duration = 2,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    if (!isInView) return

    const controls = animate(count, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    })

    return controls.stop
  }, [isInView, count, value, duration])

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}
