import type {VariantProps} from 'class-variance-authority'

import {Slot} from '@radix-ui/react-slot'
import {cva} from 'class-variance-authority'
import * as React from 'react'

import {Separator} from '@/components/ui/separator'
import {cn} from '@/lib/utils'

function ItemGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:group/item-group vs:flex vs:flex-col', className)}
      data-slot='item-group'
      role='list'
      {...props}
    />
  )
}

function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      className={cn('vs:my-0', className)}
      data-slot='item-separator'
      orientation='horizontal'
      {...props}
    />
  )
}

const itemVariants = cva(
  'vs:group/item vs:flex vs:items-center vs:border vs:border-transparent vs:text-sm vs:rounded-md vs:transition-colors vs:[a]:hover:bg-accent/50 vs:[a]:transition-colors vs:duration-100 vs:flex-wrap vs:outline-none vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default: 'vs:bg-transparent',
        outline: 'vs:border-border',
        muted: 'vs:bg-muted/50',
      },
      size: {
        default: 'vs:p-4 vs:gap-4 ',
        sm: 'vs:py-3 vs:px-4 vs:gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Item({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof itemVariants> & {asChild?: boolean}) {
  const Comp = asChild ? Slot : 'div'
  return (
    <Comp
      data-size={size}
      className={cn(itemVariants({variant, size, className}))}
      data-variant={variant}
      data-slot='item'
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  'vs:flex vs:shrink-0 vs:items-center vs:justify-center vs:gap-2 vs:group-has-[[data-slot=item-description]]/item:self-start vs:[&_svg]:pointer-events-none vs:group-has-[[data-slot=item-description]]/item:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'vs:bg-transparent',
        icon: "vs:size-8 vs:border vs:rounded-sm vs:bg-muted vs:[&_svg:not([class*='vs:size-'])]:size-4",
        image:
          'vs:size-10 vs:rounded-sm vs:overflow-hidden vs:[&_img]:size-full vs:[&_img]:object-cover',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function ItemMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      className={cn(itemMediaVariants({variant, className}))}
      data-variant={variant}
      data-slot='item-media'
      {...props}
    />
  )
}

function ItemContent({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='item-content'
      className={cn(
        'vs:flex vs:flex-1 vs:flex-col vs:gap-1 vs:[&+[data-slot=item-content]]:flex-none',
        className,
      )}
      {...props}
    />
  )
}

function ItemTitle({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='item-title'
      className={cn(
        'vs:flex vs:w-fit vs:items-center vs:gap-2 vs:text-sm vs:leading-snug vs:font-medium',
        className,
      )}
      {...props}
    />
  )
}

function ItemDescription({className, ...props}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot='item-description'
      className={cn(
        'vs:text-muted-foreground vs:line-clamp-2 vs:text-sm vs:leading-normal vs:font-normal vs:text-balance',
        'vs:[&>a:hover]:text-primary vs:[&>a]:underline vs:[&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  )
}

function ItemActions({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:flex vs:items-center vs:gap-2', className)}
      data-slot='item-actions'
      {...props}
    />
  )
}

function ItemHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='item-header'
      className={cn(
        'vs:flex vs:basis-full vs:items-center vs:justify-between vs:gap-2',
        className,
      )}
      {...props}
    />
  )
}

function ItemFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='item-footer'
      className={cn(
        'vs:flex vs:basis-full vs:items-center vs:justify-between vs:gap-2',
        className,
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
}
