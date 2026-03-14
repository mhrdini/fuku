import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@fuku/ui/lib/utils'
import { cva } from 'class-variance-authority'

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
  {
    variants: {
      size: {
        default: 'h-9 px-3 py-1',
        chip: 'text-sm px-2 py-1 w-fit whitespace-nowrap shrink-0 gap-1',
        sm: 'h-8',
        lg: 'h-10 px-6',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
)

function Input({
  className,
  type,
  size,
  ...props
}: Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(inputVariants({ size, className }))}
      {...props}
    />
  )
}

export { Input }
