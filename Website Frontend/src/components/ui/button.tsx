import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-forest-700 hover:shadow-card',
        secondary:
          'bg-gold-500 text-secondary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-gold-600 hover:shadow-card',
        outline:
          'border-2 border-primary bg-transparent text-primary hover:-translate-y-0.5 hover:bg-forest-50',
        ghost: 'text-foreground hover:bg-forest-50',
        link: 'text-primary underline-offset-4 hover:underline',
        glow:
          'bg-gradient-to-br from-gold-400 to-gold-600 text-forest-900 shadow-[0_10px_30px_-6px_rgba(212,146,10,0.6)] hover:-translate-y-0.5 hover:from-gold-400 hover:to-gold-500 hover:shadow-[0_18px_46px_-8px_rgba(212,146,10,0.78)]',
        glass:
          'border border-white/40 bg-white/10 text-white backdrop-blur-md hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20 hover:text-white',
      },
      size: {
        default: 'min-h-12 px-6',
        sm: 'min-h-10 rounded-xl px-4 text-xs',
        lg: 'min-h-14 rounded-2xl px-8 text-base',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
