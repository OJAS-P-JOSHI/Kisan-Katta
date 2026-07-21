import { BrandLogo } from '@/components/common/BrandLogo'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  priority?: boolean
}

/** @deprecated Use BrandLogo directly — kept for backward compatibility */
export function Logo({ className, size = 'md', priority }: LogoProps) {
  return <BrandLogo className={cn(className)} size={size} priority={priority} />
}
