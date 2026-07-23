import { useCallback, useState, type ImgHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string
  priority?: boolean
}

/**
 * Image with lazy-loading defaults, async decode, and a soft fade-in after load.
 * Keeps a single `<img>` so `object-cover` / aspect utilities from callers still apply.
 */
export function OptimizedImage({
  className,
  aspectRatio,
  priority = false,
  alt,
  width,
  height,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true)
      onLoad?.(e)
    },
    [onLoad],
  )

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true)
      onError?.(e)
    },
    [onError],
  )

  return (
    <img
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
      className={cn(
        'block max-w-full bg-gradient-to-br from-forest-50 via-cream to-mist transition-opacity duration-500 ease-out',
        loaded ? 'opacity-100' : 'opacity-0',
        aspectRatio && `aspect-[${aspectRatio}]`,
        className,
      )}
      {...props}
    />
  )
}
