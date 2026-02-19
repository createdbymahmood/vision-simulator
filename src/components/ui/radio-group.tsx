'use client'

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import {CircleIcon} from 'lucide-react'
import * as React from 'react'

import {cn} from '@/lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn('vs:grid vs:gap-3', className)}
      data-slot='radio-group'
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot='radio-group-item'
      className={cn(
        'vs:border-input vs:text-primary vs:focus-visible:border-ring vs:focus-visible:ring-ring/50 vs:aria-invalid:ring-destructive/20 vs:dark:aria-invalid:ring-destructive/40 vs:aria-invalid:border-destructive vs:dark:bg-input/30 vs:aspect-square vs:size-4 vs:shrink-0 vs:rounded-full vs:border vs:shadow-xs vs:transition-[color,box-shadow] vs:outline-none vs:focus-visible:ring-[3px] vs:disabled:cursor-not-allowed vs:disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        className='vs:relative vs:flex vs:items-center vs:justify-center'
        data-slot='radio-group-indicator'
      >
        <CircleIcon className='vs:fill-primary vs:absolute vs:top-1/2 vs:left-1/2 vs:size-2 vs:-translate-x-1/2 vs:-translate-y-1/2' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export {RadioGroup, RadioGroupItem}
