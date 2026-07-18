import { motion, type HTMLMotionProps } from 'framer-motion'
import { useCallback, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Ripple {
  id: number
  x: number
  y: number
}

interface InteractiveCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function InteractiveCard({
  children,
  className,
  disabled = false,
  ...props
}: InteractiveCardProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleId = useRef(0)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = rippleId.current++
      setRipples((prev) => [...prev, { id, x, y }])
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    },
    [disabled],
  )

  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -4, scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onPointerDown={handlePointerDown}
      className={cn(
        'relative overflow-hidden rounded-2xl shadow-soft transition-shadow duration-300',
        !disabled && 'hover:shadow-card active:shadow-lift',
        className,
      )}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute animate-ripple rounded-full bg-forest-700/10"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 8,
            height: 8,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {children}
    </motion.div>
  )
}
