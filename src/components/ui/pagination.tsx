import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
import * as React from 'react'

import type {Button} from '@/components/ui/button'

import {buttonVariants} from '@/components/ui/button'
import {cn} from '@/lib/utils'

function Pagination({className, ...props}: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label='pagination'
      data-slot='pagination'
      role='navigation'
      className={cn(
        'vs:mx-auto vs:flex vs:w-full vs:justify-center',
        className,
      )}
      {...props}
    />
  )
}

function PaginationContent({className, ...props}: React.ComponentProps<'ul'>) {
  return (
    <ul
      className={cn('vs:flex vs:flex-row vs:items-center vs:gap-1', className)}
      data-slot='pagination-content'
      {...props}
    />
  )
}

function PaginationItem({...props}: React.ComponentProps<'li'>) {
  return <li data-slot='pagination-item' {...props} />
}

type PaginationLinkProps = Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'> & {
    isActive?: boolean
  }

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-active={isActive}
      data-slot='pagination-link'
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    >
      {children ?? <span className='vs:sr-only'>Page</span>}
    </a>
  )
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      size='default'
      aria-label='Go to previous page'
      className={cn('vs:gap-1 vs:px-2.5 vs:sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className='vs:hidden vs:sm:block'>Previous</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      size='default'
      aria-label='Go to next page'
      className={cn('vs:gap-1 vs:px-2.5 vs:sm:pr-2.5', className)}
      {...props}
    >
      <span className='vs:hidden vs:sm:block'>Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        'vs:flex vs:size-9 vs:items-center vs:justify-center',
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon className='vs:size-4' />
      <span className='vs:sr-only'>More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
