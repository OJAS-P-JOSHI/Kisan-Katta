import { BrandLogo } from '@/components/common/BrandLogo'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BrandCardProps {
  title?: string
  description?: string
  className?: string
}

export function BrandCard({
  title = 'Kisan Katta',
  description = 'Maharashtra\'s farming companion',
  className,
}: BrandCardProps) {
  return (
    <Card className={cn('border-forest-100/80 bg-white shadow-card', className)}>
      <CardContent className="flex flex-col items-center p-6 text-center sm:p-8">
        <BrandLogo size="xl" showLink={false} />
        <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
        <p className="font-marathi mt-1 text-sm text-forest-700">किसान कट्टा</p>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
