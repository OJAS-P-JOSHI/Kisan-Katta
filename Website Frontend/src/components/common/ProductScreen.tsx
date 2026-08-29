import { useState } from 'react'

import { ComingSoonScreen } from '@/components/sections/ComingSoonScreen'
import { OptimizedImage } from '@/components/common/OptimizedImage'
import { cn } from '@/lib/utils'

interface ProductScreenProps {
  src: string
  alt: string
}

/**
 * Loads a real screenshot when the file exists at `src`.
 * If the file is missing (404), shows the branded Coming Soon state.
 * Drop a WebP at the registered path to swap automatically.
 */
export function ProductScreen({ src, alt }: ProductScreenProps) {
  const [state, setState] = useState<'pending' | 'ready' | 'missing'>('pending')

  return (
    <div className="absolute inset-0">
      {state !== 'ready' && <ComingSoonScreen />}
      <OptimizedImage
        src={src}
        alt={state === 'ready' ? alt : ''}
        width={390}
        height={844}
        className={cn(
          'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500',
          state === 'ready' ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onLoad={() => setState('ready')}
        onError={() => setState('missing')}
      />
    </div>
  )
}
