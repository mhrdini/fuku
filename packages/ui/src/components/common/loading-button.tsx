import { Button, buttonVariants, Spinner } from '@fuku/ui/components'
import { cn } from '@fuku/ui/lib/utils'
import { VariantProps } from 'class-variance-authority'

export const LoadingButton = ({
  loading,
  disabled,
  children,
  className,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading: boolean
  }) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn('relative', className)}
    >
      <span className={cn(loading && 'opacity-0')}>{children}</span>
      {loading && (
        <span className='absolute inset-0 flex items-center justify-center'>
          <Spinner />
        </span>
      )}
    </Button>
  )
}
