import * as React from 'react'

import {cn} from '@/lib/utils'

function Card({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card'
      className={cn(
        'vs:bg-card vs:text-card-foreground vs:flex vs:flex-col vs:gap-6 vs:rounded-xl vs:border vs:py-6 vs:shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'vs:@container/card-header vs:grid vs:auto-rows-min vs:grid-rows-[auto_auto] vs:items-start vs:gap-2 vs:px-6 vs:has-data-[slot=card-action]:grid-cols-[1fr_auto] vs:[.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:leading-none vs:font-semibold', className)}
      data-slot='card-title'
      {...props}
    />
  )
}

function CardDescription({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:text-muted-foreground vs:text-sm', className)}
      data-slot='card-description'
      {...props}
    />
  )
}

function CardAction({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'vs:col-start-2 vs:row-span-2 vs:row-start-1 vs:self-start vs:justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('vs:px-6', className)}
      data-slot='card-content'
      {...props}
    />
  )
}

function CardFooter({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn(
        'vs:flex vs:items-center vs:px-6 vs:[.border-t]:pt-6',
        className,
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
}
