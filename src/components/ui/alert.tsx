import type {VariantProps} from 'class-variance-authority'

import {cva} from 'class-variance-authority'
import * as React from 'react'

import {cn} from '@/lib/utils'

const alertVariants = cva(
  'vs:relative vs:w-full vs:rounded-lg vs:border vs:px-4 vs:py-3 vs:text-sm vs:grid vs:has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] vs:grid-cols-[0_1fr] vs:has-[>svg]:gap-x-3 vs:gap-y-0.5 vs:items-start vs:[&>svg]:size-4 vs:[&>svg]:translate-y-0.5 vs:[&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'vs:bg-card vs:text-card-foreground',
        destructive:
          'vs:text-destructive vs:bg-card vs:[&>svg]:text-current vs:*:data-[slot=alert-description]:text-destructive/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      className={cn(alertVariants({variant}), className)}
      data-slot='alert'
      role='alert'
      {...props}
    />
  )
}

function AlertTitle({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-title'
      className={cn(
        'vs:col-start-2 vs:line-clamp-1 vs:min-h-4 vs:font-medium vs:tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='alert-description'
      className={cn(
        'vs:text-muted-foreground vs:col-start-2 vs:grid vs:justify-items-start vs:gap-1 vs:text-sm vs:[&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export {Alert, AlertDescription, AlertTitle}
