import { cn } from '@fuku/ui/lib/utils'
import { LineSquiggleIcon } from 'lucide-react'

export const Logo = ({
  onClick,
  className,
  iconClassName,
  textClassName,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>
  className?: string
  iconClassName?: string
  textClassName?: string
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-transparent px-4 py-2 rounded-full cursor-pointer hover:bg-bg-transparent active:bg-bg-transparent focus:bg-bg-transparent flex items-center gap-1',
        className,
      )}
    >
      <LineSquiggleIcon className={cn('stroke-1', iconClassName)} />
      <p className={cn('font-semibold', textClassName)}>fuku</p>
    </div>
  )
}
