import { cn } from '@/lib/utils'
import type { ImgHTMLAttributes } from 'react'

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string
  priority?: boolean
}

export function OptimizedImage({
  className,
  aspectRatio,
  priority = false,
  alt,
  width,
  height,
  ...props
}: OptimizedImageProps) {
  return (
    <img
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('block max-w-full', aspectRatio && `aspect-[${aspectRatio}]`, className)}
      {...props}
    />
  )
}
