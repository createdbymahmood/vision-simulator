import {Slot} from '@radix-ui/react-slot'
import {ChevronRight, MoreHorizontal} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function Breadcrumb({...props}: React.ComponentProps<'nav'>) {
  return <nav aria-label='breadcrumb' data-slot='breadcrumb' {...props} />
}

function BreadcrumbList({className, ...props}: React.ComponentProps<'ol'>) {
  return (
    <ol
      data-slot='breadcrumb-list'
      className={cn(
        'vs:text-muted-foreground vs:flex vs:flex-wrap vs:items-center vs:gap-1.5 vs:text-sm vs:break-words vs:sm:gap-2.5',
        className,
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({className, ...props}: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('vs:inline-flex vs:items-center vs:gap-1.5', className)}
      data-slot='breadcrumb-item'
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<'a'> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : 'a'

  return (
    <Comp
      className={cn('vs:hover:text-foreground vs:transition-colors', className)}
      data-slot='breadcrumb-link'
      {...props}
    />
  )
}

function BreadcrumbPage({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-current='page'
      aria-disabled='true'
      className={cn('vs:text-foreground vs:font-normal', className)}
      data-slot='breadcrumb-page'
      role='link'
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      aria-hidden='true'
      className={cn('vs:[&>svg]:size-3.5', className)}
      data-slot='breadcrumb-separator'
      role='presentation'
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden='true'
      data-slot='breadcrumb-ellipsis'
      role='presentation'
      className={cn(
        'vs:flex vs:size-9 vs:items-center vs:justify-center',
        className,
      )}
      {...props}
    >
      <MoreHorizontal className='vs:size-4' />
      <span className='vs:sr-only'>More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
