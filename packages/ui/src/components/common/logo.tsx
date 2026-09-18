import { cn } from '@fuku/ui/lib/utils'
import { LineSquiggleIcon } from 'lucide-react'

export function Logo({
  onClick,
  className,
  iconClassName,
  textClassName,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>
  className?: string
  iconClassName?: string
  textClassName?: string
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'hover:bg-bg-transparent active:bg-bg-transparent focus:bg-bg-transparent flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-4 py-2',
        className,
      )}
    >
      <LineSquiggleIcon className={cn('stroke-1', iconClassName)} />
      <p className={cn('font-semibold', textClassName)}>fuku</p>
    </div>
  )
}
