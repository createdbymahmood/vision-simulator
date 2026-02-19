import type {VariantProps} from 'class-variance-authority'

import {Slot} from '@radix-ui/react-slot'
import {cva} from 'class-variance-authority'
import * as React from 'react'

import {cn} from '@/lib/utils'

const badgeVariants = cva(
  'vs:inline-flex vs:items-center vs:justify-center vs:rounded-full vs:border vs:px-2 vs:py-0.5 vs:text-xs vs:font-medium vs:w-fit vs:whitespace-nowrap vs:shrink-0 vs:[&>svg]:size-3 vs:gap-1 vs:[&>svg]:pointer-events-none vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:ring-[3px] vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:transition-[color,box-shadow] vs:overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'vs:border-transparent vs:bg-primary vs:text-primary-foreground vs:[a&]:hover:bg-primary/90',
        secondary:
          'vs:border-transparent vs:bg-secondary vs:text-secondary-foreground vs:[a&]:hover:bg-secondary/90',
        destructive:
          'vs:border-transparent vs:bg-destructive vs:text-white vs:[a&]:hover:bg-destructive/90 vs:focus-visible:ring-destructive/20 vs:dark:focus-visible:ring-destructive/40 vs:dark:bg-destructive/60',
        outline:
          'vs:text-foreground vs:[a&]:hover:bg-accent vs:[a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      className={cn(badgeVariants({variant}), className)}
      data-slot='badge'
      {...props}
    />
  )
}

export {Badge, badgeVariants}
