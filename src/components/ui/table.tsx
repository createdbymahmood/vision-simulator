import * as React from 'react'

import {cn} from '@/lib/utils'

function Table({className, ...props}: React.ComponentProps<'table'>) {
  return (
    <div
      className='vs:relative vs:w-full vs:overflow-x-auto'
      data-slot='table-container'
    >
      <table
        className={cn('vs:w-full vs:caption-bottom vs:text-sm', className)}
        data-slot='table'
        {...props}
      />
    </div>
  )
}

function TableHeader({className, ...props}: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('vs:[&_tr]:border-b', className)}
      data-slot='table-header'
      {...props}
    />
  )
}

function TableBody({className, ...props}: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      className={cn('vs:[&_tr:last-child]:border-0', className)}
      data-slot='table-body'
      {...props}
    />
  )
}

function TableFooter({className, ...props}: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot='table-footer'
      className={cn(
        'vs:bg-muted/50 vs:border-t vs:font-medium vs:[&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

function TableRow({className, ...props}: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot='table-row'
      className={cn(
        'vs:hover:bg-muted/50 vs:data-[state=selected]:bg-muted vs:border-b vs:transition-colors',
        className,
      )}
      {...props}
    />
  )
}

function TableHead({className, ...props}: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot='table-head'
      className={cn(
        'vs:text-foreground vs:h-10 vs:px-2 vs:text-left vs:align-middle vs:font-medium vs:whitespace-nowrap vs:[&:has([role=checkbox])]:pr-0 vs:[&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCell({className, ...props}: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot='table-cell'
      className={cn(
        'vs:p-2 vs:align-middle vs:whitespace-nowrap vs:[&:has([role=checkbox])]:pr-0 vs:[&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

function TableCaption({className, ...props}: React.ComponentProps<'caption'>) {
  return (
    <caption
      className={cn('vs:text-muted-foreground vs:mt-4 vs:text-sm', className)}
      data-slot='table-caption'
      {...props}
    />
  )
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
