import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@fuku/ui/lib/utils'
import { cva } from 'class-variance-authority'

const inputVariants = cva(
  'w-full min-w-0 rounded-none border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
  {
    variants: {
      variant: {
        default: 'h-8 px-3 py-1',
        chip: 'px-2 py-1 w-fit whitespace-nowrap shrink-0 gap-1',
        xs: 'h-6 px-2 py-0.5',
        sm: 'h-7',
        lg: 'h-9 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Input({
  className,
  variant = 'default',
  type,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input }
