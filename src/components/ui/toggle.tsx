import type {VariantProps} from 'class-variance-authority'

import * as TogglePrimitive from '@radix-ui/react-toggle'
import {cva} from 'class-variance-authority'
import * as React from 'react'

import {cn} from '@/lib/utils'

const toggleVariants = cva(
  "vs:inline-flex vs:items-center vs:justify-center vs:gap-2 vs:rounded-md vs:text-sm vs:font-medium vs:hover:bg-muted vs:hover:text-muted-foreground vs:disabled:pointer-events-none vs:disabled:opacity-50 vs:data-[state=on]:bg-accent vs:data-[state=on]:text-accent-foreground vs:[&_svg]:pointer-events-none vs:[&_svg:not([class*='vs:size-'])]:size-4 vs:[&_svg]:shrink-0 vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:ring-[3px] vs:outline-none vs:transition-[color,box-shadow] vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:whitespace-nowrap",
  {
    variants: {
      variant: {
        default: 'vs:bg-transparent',
        outline:
          'vs:border vs:border-input vs:bg-transparent vs:shadow-xs vs:hover:bg-accent vs:hover:text-accent-foreground',
      },
      size: {
        default: 'vs:h-9 vs:px-2 vs:min-w-9',
        sm: 'vs:h-8 vs:px-1.5 vs:min-w-8',
        lg: 'vs:h-10 vs:px-2.5 vs:min-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      className={cn(toggleVariants({variant, size, className}))}
      data-slot='toggle'
      {...props}
    />
  )
}

export {Toggle, toggleVariants}
