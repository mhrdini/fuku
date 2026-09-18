import { Card, CardTitle } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'

type SectionCardProps = {
  title?: string
  icon?: React.ElementType
  className?: string
  children?: React.ReactNode
}

export function SectionCard({
  title,
  icon: Icon,
  className,
  children,
}: SectionCardProps) {
  return (
    <Card className={cn('gap-0 p-6', className)}>
      {title && (
        <CardTitle className='mb-2 flex items-center gap-2 text-lg font-semibold'>
          {Icon && <Icon className='size-3.5' />}
          {title}
        </CardTitle>
      )}
      <div className='flex-1'>{children}</div>
    </Card>
  )
}
