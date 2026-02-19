'use client'

import type {VariantProps} from 'class-variance-authority'

import {cva} from 'class-variance-authority'
import * as React from 'react'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {cn} from '@/lib/utils'

function InputGroup({className, ...props}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='input-group'
      role='group'
      className={cn(
        'vs:group/input-group vs:border-input vs:dark:bg-input/30 vs:relative vs:flex vs:w-full vs:items-center vs:rounded-md vs:border vs:shadow-xs vs:transition-[color,box-shadow] vs:outline-none',
        'vs:h-9 vs:min-w-0 vs:has-[>textarea]:h-auto',

        // Variants based on alignment.
        'vs:has-[>[data-align=inline-start]]:[&>input]:pl-2',
        'vs:has-[>[data-align=inline-end]]:[&>input]:pr-2',
        'vs:has-[>[data-align=block-start]]:h-auto vs:has-[>[data-align=block-start]]:flex-col vs:has-[>[data-align=block-start]]:[&>input]:pb-3',
        'vs:has-[>[data-align=block-end]]:h-auto vs:has-[>[data-align=block-end]]:flex-col vs:has-[>[data-align=block-end]]:[&>input]:pt-3',

        // Focus state.
        'vs:has-[[data-slot=input-group-control]:focus-visible]:border-ring vs:has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 vs:has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]',

        // Error state.
        'vs:has-[[data-slot][aria-invalid=true]]:ring-destructive/20 vs:has-[[data-slot][aria-invalid=true]]:border-destructive vs:dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',

        className,
      )}
      {...props}
    />
  )
}

const inputGroupAddonVariants = cva(
  "vs:text-muted-foreground vs:flex vs:h-auto vs:cursor-text vs:items-center vs:justify-center vs:gap-2 vs:py-1.5 vs:text-sm vs:font-medium vs:select-none vs:[&>svg:not([class*='size-'])]:size-4 vs:[&>kbd]:rounded-[calc(var(--radius)-5px)] vs:group-data-[disabled=true]/input-group:opacity-50",
  {
    variants: {
      align: {
        'inline-start':
          'vs:order-first vs:pl-3 vs:has-[>button]:ml-[-0.45rem] vs:has-[>kbd]:ml-[-0.35rem]',
        'inline-end':
          'vs:order-last vs:pr-3 vs:has-[>button]:mr-[-0.45rem] vs:has-[>kbd]:mr-[-0.35rem]',
        'block-start':
          'vs:order-first vs:w-full vs:justify-start vs:px-3 vs:pt-3 vs:[.border-b]:pb-3 vs:group-has-[>input]/input-group:pt-2.5',
        'block-end':
          'vs:order-last vs:w-full vs:justify-start vs:px-3 vs:pb-3 vs:[.border-t]:pt-3 vs:group-has-[>input]/input-group:pb-2.5',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
)

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof inputGroupAddonVariants>) {
  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if ((e.target as HTMLElement).closest('button')) {
        return
      }
      e.currentTarget.parentElement?.querySelector('input')?.focus()
    },
    [],
  )
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.currentTarget.parentElement?.querySelector('input')?.focus()
      }
    },
    [],
  )

  return (
    <button
      className={cn(inputGroupAddonVariants({align}), className)}
      data-align={align}
      tabIndex={0}
      type='button'
      data-slot='input-group-addon'
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

const inputGroupButtonVariants = cva(
  'vs:text-sm vs:shadow-none vs:flex vs:gap-2 vs:items-center',
  {
    variants: {
      size: {
        xs: "vs:h-6 vs:gap-1 vs:px-2 vs:rounded-[calc(var(--radius)-5px)] vs:[&>svg:not([class*='size-'])]:size-3.5 vs:has-[>svg]:px-2",
        sm: 'vs:h-8 vs:px-2.5 vs:gap-1.5 vs:rounded-md vs:has-[>svg]:px-2.5',
        'icon-xs':
          'vs:size-6 vs:rounded-[calc(var(--radius)-5px)] vs:p-0 vs:has-[>svg]:p-0',
        'icon-sm': 'vs:size-8 vs:p-0 vs:has-[>svg]:p-0',
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  },
)

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size'> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <Button
      data-size={size}
      className={cn(inputGroupButtonVariants({size}), className)}
      type={type}
      variant={variant}
      {...props}
    />
  )
}

function InputGroupText({className, ...props}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "vs:text-muted-foreground vs:flex vs:items-center vs:gap-2 vs:text-sm vs:[&_svg]:pointer-events-none vs:[&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function InputGroupInput({className, ...props}: React.ComponentProps<'input'>) {
  return (
    <Input
      data-slot='input-group-control'
      className={cn(
        'vs:flex-1 vs:rounded-none vs:border-0 vs:bg-transparent vs:shadow-none vs:focus-visible:ring-0 vs:dark:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot='input-group-control'
      className={cn(
        'vs:flex-1 vs:resize-none vs:rounded-none vs:border-0 vs:bg-transparent vs:py-3 vs:shadow-none vs:focus-visible:ring-0 vs:dark:bg-transparent',
        className,
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
}
