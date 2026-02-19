import type {VariantProps} from 'class-variance-authority'

import {cva} from 'class-variance-authority'

import {cn} from '@/lib/utils'

function Empty({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty'
      className={cn(
        'vs:flex vs:min-w-0 vs:flex-1 vs:flex-col vs:items-center vs:justify-center vs:gap-6 vs:rounded-lg vs:border-dashed vs:p-6 vs:text-center vs:text-balance vs:md:p-12',
        className,
      )}
      {...props}
    />
  )
}

function EmptyHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty-header'
      className={cn(
        'vs:flex vs:max-w-sm vs:flex-col vs:items-center vs:gap-2 vs:text-center',
        className,
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  'vs:flex vs:shrink-0 vs:items-center vs:justify-center vs:mb-2 vs:[&_svg]:pointer-events-none vs:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'vs:bg-transparent',
        icon: "vs:bg-muted vs:text-foreground vs:flex vs:size-10 vs:shrink-0 vs:items-center vs:justify-center vs:rounded-lg vs:[&_svg:not([class*='vs:size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      className={cn(emptyMediaVariants({variant, className}))}
      data-variant={variant}
      data-slot='empty-icon'
      {...props}
    />
  )
}

function EmptyTitle({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:text-lg vs:font-medium vs:tracking-tight', className)}
      data-slot='empty-title'
      {...props}
    />
  )
}

function EmptyDescription({className, ...props}: React.ComponentProps<'p'>) {
  return (
    <div
      data-slot='empty-description'
      className={cn(
        'vs:text-muted-foreground vs:[&>a:hover]:text-primary vs:text-sm/relaxed vs:[&>a]:underline vs:[&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

function EmptyContent({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='empty-content'
      className={cn(
        'vs:flex vs:w-full vs:max-w-sm vs:min-w-0 vs:flex-col vs:items-center vs:gap-4 vs:text-sm vs:text-balance',
        className,
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
}
