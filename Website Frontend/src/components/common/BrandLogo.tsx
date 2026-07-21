import { Link } from 'react-router-dom'

import { OptimizedImage } from '@/components/common/OptimizedImage'
import { brandAssets } from '@/data/images'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLink?: boolean
  priority?: boolean
}

const sizeMap = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
} as const

export function BrandLogo({
  className,
  size = 'md',
  showLink = true,
  priority = false,
}: BrandLogoProps) {
  const image = (
    <OptimizedImage
      src={brandAssets.logo}
      alt="Kisan Katta"
      width={size === 'xl' ? 80 : size === 'lg' ? 56 : size === 'md' ? 44 : 36}
      height={size === 'xl' ? 80 : size === 'lg' ? 56 : size === 'md' ? 44 : 36}
      priority={priority}
      className={cn('rounded-full object-cover shadow-soft', sizeMap[size], className)}
    />
  )

  if (!showLink) return image

  return (
    <Link to="/" className="inline-flex shrink-0 touch-target items-center justify-center" aria-label="Kisan Katta Home">
      {image}
    </Link>
  )
}
